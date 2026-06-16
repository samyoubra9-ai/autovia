import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import { logSiteAdminAction } from "@/lib/api/site-admin-audit"
import {
  applyVerificationAdminAction,
  type VerificationAdminAction,
} from "@/lib/api/verification-admin"
import { siteAdminAutoEcoleInclude, toSiteAdminAutoEcoleDto } from "@/lib/api/site-admin-dto"
import { prisma } from "@/lib/prisma"
import { loadVerificationSnapshot } from "@/lib/verification/documents"
import { verificationStatusLabel } from "@/lib/verification/constants"
import { createVerificationSignedUrl } from "@/lib/verification/storage"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)
    const { id } = await params
    const snapshot = await loadVerificationSnapshot(prisma, id)

    const docs = await prisma.autoEcoleVerificationDocument.findMany({
      where: { autoEcoleId: id },
      orderBy: { kind: "asc" },
    })

    const downloadUrls = await Promise.all(
      docs.map(async (doc) => ({
        kind: doc.kind,
        fileName: doc.fileName,
        url: await createVerificationSignedUrl(doc.storagePath, 600),
      })),
    )

    return jsonWithCors(
      {
        verification: {
          ...snapshot,
          statusLabel: verificationStatusLabel(snapshot.status),
          downloadUrls,
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const { siteAdmin } = await requireSiteAdminApi(request)
    const { id } = await params
    const body = (await request.json()) as {
      action?: VerificationAdminAction
      rejectionReason?: string
    }

    const action = body.action
    if (!action || !["approve", "reject", "purge_documents"].includes(action)) {
      throw new ApiError(400, "Action invalide (approve, reject, purge_documents).")
    }

    const result = await applyVerificationAdminAction(prisma, id, action, {
      rejectionReason: body.rejectionReason,
    })

    const updated = await prisma.autoEcole.findUnique({
      where: { id },
      include: siteAdminAutoEcoleInclude,
    })
    if (!updated) throw new ApiError(404, "Auto-école introuvable.")

    await logSiteAdminAction(prisma, {
      siteAdminId: siteAdmin.id,
      autoEcoleId: id,
      action: `verification_${action}`,
      detail: result.message,
    })

    const verification = await loadVerificationSnapshot(prisma, id)

    return jsonWithCors(
      {
        autoEcole: toSiteAdminAutoEcoleDto(updated),
        verification: {
          ...verification,
          statusLabel: verificationStatusLabel(verification.status),
        },
        message: result.message,
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
