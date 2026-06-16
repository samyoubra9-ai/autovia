import type { VerificationDocumentKind, VerificationStatus } from "@prisma/client"

export const VERIFICATION_BUCKET = "auto-ecole-verification"
export const VERIFICATION_MAX_BYTES = 10 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function verificationExtensionFromMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null
}

export function buildVerificationStoragePath(
  autoEcoleId: string,
  kind: VerificationDocumentKind,
  ext: string,
): string {
  return `${autoEcoleId}/${kind.toLowerCase()}.${ext}`
}

export type VerificationDocumentDto = {
  kind: VerificationDocumentKind
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

export type VerificationSnapshot = {
  status: VerificationStatus
  rejectionReason: string | null
  reviewedAt: string | null
  documentsPurgedAt: string | null
  documents: VerificationDocumentDto[]
  hasAgrement: boolean
  hasIdentite: boolean
  readyForReview: boolean
}

export function verificationStatusLabel(status: VerificationStatus): string {
  const labels: Record<VerificationStatus, string> = {
    PENDING_DOCUMENTS: "Documents à envoyer",
    PENDING_REVIEW: "En attente de validation",
    APPROVED: "Validé",
    REJECTED: "Refusé",
  }
  return labels[status]
}

export function isVerificationApproved(status: VerificationStatus): boolean {
  return status === "APPROVED"
}

export function documentKindLabel(kind: VerificationDocumentKind): string {
  return kind === "AGREMENT" ? "Agrément auto-école" : "Carte d'identité"
}
