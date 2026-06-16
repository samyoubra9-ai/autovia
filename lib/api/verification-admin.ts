import type { VerificationStatus } from "@prisma/client"

import { getTrialEndsAt } from "@/lib/auth-utils"
import { ApiError } from "@/lib/api/errors"
import type { PrismaDb } from "@/lib/prisma"
import { removeVerificationPaths } from "@/lib/verification/storage"

export type VerificationAdminAction = "approve" | "reject" | "purge_documents"

export async function applyVerificationAdminAction(
  db: PrismaDb,
  autoEcoleId: string,
  action: VerificationAdminAction,
  options?: { rejectionReason?: string },
): Promise<{ message: string; verificationStatus: VerificationStatus }> {
  const ae = await db.autoEcole.findUnique({
    where: { id: autoEcoleId },
    include: { verificationDocuments: true },
  })
  if (!ae) throw new ApiError(404, "Auto-école introuvable.")

  if (action === "approve") {
    if (ae.verificationStatus !== "PENDING_REVIEW") {
      throw new ApiError(400, "Seuls les dossiers en attente de validation peuvent être approuvés.")
    }
    const hasBoth =
      ae.verificationDocuments.some((d) => d.kind === "AGREMENT") &&
      ae.verificationDocuments.some((d) => d.kind === "IDENTITE")
    if (!hasBoth) {
      throw new ApiError(400, "Les deux documents (agrément + identité) sont requis.")
    }

    const trialEndsAt = getTrialEndsAt()
    await db.autoEcole.update({
      where: { id: autoEcoleId },
      data: {
        verificationStatus: "APPROVED",
        verificationRejectionReason: null,
        verificationReviewedAt: new Date(),
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        paidUntil: null,
      },
    })
    return {
      verificationStatus: "APPROVED",
      message: "Dossier validé — essai gratuit de 15 jours activé.",
    }
  }

  if (action === "reject") {
    const reason = options?.rejectionReason?.trim()
    if (!reason) {
      throw new ApiError(400, "Indiquez un motif de refus.")
    }
    if (ae.verificationStatus !== "PENDING_REVIEW") {
      throw new ApiError(400, "Seuls les dossiers en attente peuvent être refusés.")
    }
    await db.autoEcole.update({
      where: { id: autoEcoleId },
      data: {
        verificationStatus: "REJECTED",
        verificationRejectionReason: reason,
        verificationReviewedAt: new Date(),
        subscriptionStatus: "EXPIRED",
      },
    })
    return {
      verificationStatus: "REJECTED",
      message: "Dossier refusé — l'auto-école peut renvoyer des documents.",
    }
  }

  if (action === "purge_documents") {
    if (ae.verificationDocuments.length === 0) {
      throw new ApiError(400, "Aucun document à supprimer.")
    }
    const paths = ae.verificationDocuments.map((d) => d.storagePath)
    await removeVerificationPaths(paths)
    await db.$transaction([
      db.autoEcoleVerificationDocument.deleteMany({ where: { autoEcoleId } }),
      db.autoEcole.update({
        where: { id: autoEcoleId },
        data: { verificationDocumentsPurgedAt: new Date() },
      }),
    ])
    return {
      verificationStatus: ae.verificationStatus,
      message: "Documents supprimés du serveur. Téléchargez-les avant si besoin.",
    }
  }

  throw new ApiError(400, "Action inconnue.")
}
