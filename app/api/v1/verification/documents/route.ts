import type { VerificationDocumentKind } from "@prisma/client"

import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenantMembership } from "@/lib/api/auth"
import { prisma } from "@/lib/prisma"
import {
  loadVerificationSnapshot,
  syncVerificationStatusAfterUpload,
  toVerificationDocumentDto,
} from "@/lib/verification/documents"
import {
  VERIFICATION_MAX_BYTES,
  buildVerificationStoragePath,
  verificationExtensionFromMime,
  verificationStatusLabel,
} from "@/lib/verification/constants"
import { uploadVerificationDocument, removeVerificationPaths } from "@/lib/verification/storage"

const ALLOWED_KINDS = new Set<VerificationDocumentKind>(["AGREMENT", "IDENTITE"])

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenantMembership(request)
    const ae = await prisma.autoEcole.findUniqueOrThrow({
      where: { id: tenant.autoEcoleId },
    })

    if (
      ae.verificationStatus !== "PENDING_DOCUMENTS" &&
      ae.verificationStatus !== "REJECTED"
    ) {
      throw new ApiError(
        403,
        "Les documents ne peuvent plus être modifiés à ce stade.",
        "VERIFICATION_LOCKED",
      )
    }

    const form = await request.formData()
    const kindRaw = String(form.get("kind") ?? "").trim().toUpperCase()
    if (!ALLOWED_KINDS.has(kindRaw as VerificationDocumentKind)) {
      throw new ApiError(400, "Type de document invalide (AGREMENT ou IDENTITE).")
    }
    const kind = kindRaw as VerificationDocumentKind

    const file = form.get("file")
    if (!(file instanceof File)) {
      throw new ApiError(400, "Fichier manquant.")
    }
    if (file.size > VERIFICATION_MAX_BYTES) {
      throw new ApiError(400, "Le fichier ne doit pas dépasser 10 Mo.")
    }
    const ext = verificationExtensionFromMime(file.type)
    if (!ext) {
      throw new ApiError(400, "Format accepté : PDF, JPEG, PNG ou WebP.")
    }

    const storagePath = buildVerificationStoragePath(tenant.autoEcoleId, kind, ext)
    const bytes = Buffer.from(await file.arrayBuffer())

    const existing = await prisma.autoEcoleVerificationDocument.findUnique({
      where: { autoEcoleId_kind: { autoEcoleId: tenant.autoEcoleId, kind } },
    })
    if (existing && existing.storagePath !== storagePath) {
      await removeVerificationPaths([existing.storagePath])
    }

    await uploadVerificationDocument(storagePath, bytes, file.type)

    const doc = await prisma.autoEcoleVerificationDocument.upsert({
      where: { autoEcoleId_kind: { autoEcoleId: tenant.autoEcoleId, kind } },
      create: {
        autoEcoleId: tenant.autoEcoleId,
        kind,
        storagePath,
        fileName: file.name || `${kind.toLowerCase()}.${ext}`,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      update: {
        storagePath,
        fileName: file.name || `${kind.toLowerCase()}.${ext}`,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAt: new Date(),
      },
    })

    await syncVerificationStatusAfterUpload(prisma, tenant.autoEcoleId)
    const verification = await loadVerificationSnapshot(prisma, tenant.autoEcoleId)

    return jsonWithCors(
      {
        document: toVerificationDocumentDto(doc),
        verification: {
          ...verification,
          statusLabel: verificationStatusLabel(verification.status),
        },
        message:
          verification.status === "PENDING_REVIEW"
            ? "Documents complets — votre dossier est en cours de validation."
            : "Document enregistré.",
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
