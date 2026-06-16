import type { AutoEcoleVerificationDocument, VerificationStatus } from "@prisma/client"

import type { PrismaDb } from "@/lib/prisma"

import {
  type VerificationDocumentDto,
  type VerificationSnapshot,
  documentKindLabel,
} from "./constants"

export function toVerificationDocumentDto(
  doc: AutoEcoleVerificationDocument,
): VerificationDocumentDto {
  return {
    kind: doc.kind,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedAt: doc.uploadedAt.toISOString(),
  }
}

export async function loadVerificationSnapshot(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<VerificationSnapshot & { autoEcoleNom: string }> {
  const ae = await db.autoEcole.findUnique({
    where: { id: autoEcoleId },
    include: { verificationDocuments: { orderBy: { kind: "asc" } } },
  })
  if (!ae) {
    throw new Error("Auto-école introuvable.")
  }

  const documents = ae.verificationDocuments.map(toVerificationDocumentDto)
  const hasAgrement = documents.some((d) => d.kind === "AGREMENT")
  const hasIdentite = documents.some((d) => d.kind === "IDENTITE")

  return {
    autoEcoleNom: ae.nom,
    status: ae.verificationStatus,
    rejectionReason: ae.verificationRejectionReason,
    reviewedAt: ae.verificationReviewedAt?.toISOString() ?? null,
    documentsPurgedAt: ae.verificationDocumentsPurgedAt?.toISOString() ?? null,
    documents,
    hasAgrement,
    hasIdentite,
    readyForReview: hasAgrement && hasIdentite,
  }
}

export async function syncVerificationStatusAfterUpload(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<VerificationStatus> {
  const docs = await db.autoEcoleVerificationDocument.findMany({
    where: { autoEcoleId },
    select: { kind: true },
  })
  const hasAgrement = docs.some((d) => d.kind === "AGREMENT")
  const hasIdentite = docs.some((d) => d.kind === "IDENTITE")

  const ae = await db.autoEcole.findUniqueOrThrow({
    where: { id: autoEcoleId },
    select: { verificationStatus: true },
  })

  if (
    ae.verificationStatus === "PENDING_DOCUMENTS" ||
    ae.verificationStatus === "REJECTED"
  ) {
    if (hasAgrement && hasIdentite) {
      await db.autoEcole.update({
        where: { id: autoEcoleId },
        data: {
          verificationStatus: "PENDING_REVIEW",
          verificationRejectionReason: null,
        },
      })
      return "PENDING_REVIEW"
    }
    if (ae.verificationStatus === "REJECTED") {
      await db.autoEcole.update({
        where: { id: autoEcoleId },
        data: {
          verificationStatus: "PENDING_DOCUMENTS",
          verificationRejectionReason: null,
        },
      })
      return "PENDING_DOCUMENTS"
    }
  }

  return ae.verificationStatus
}

export function verificationDocumentsSummary(
  documents: VerificationDocumentDto[],
): string {
  if (documents.length === 0) return "Aucun document"
  return documents
    .map((d) => `${documentKindLabel(d.kind)} (${d.fileName})`)
    .join(" · ")
}
