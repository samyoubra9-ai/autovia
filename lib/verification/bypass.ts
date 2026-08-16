import type { AutoEcole, VerificationStatus } from "@prisma/client"

import { getTrialEndsAt } from "@/lib/auth-utils"
import type { PrismaDb } from "@/lib/prisma"

import { isVerificationDocumentsEnabled } from "./constants"

const PENDING_STATUSES = new Set<VerificationStatus>([
  "PENDING_DOCUMENTS",
  "PENDING_REVIEW",
  "REJECTED",
])

export function initialVerificationStatusForRegistration(): VerificationStatus {
  return isVerificationDocumentsEnabled() ? "PENDING_DOCUMENTS" : "APPROVED"
}

export function initialSubscriptionStatusForRegistration(): "EXPIRED" | "TRIAL" {
  return isVerificationDocumentsEnabled() ? "EXPIRED" : "TRIAL"
}

/**
 * Comptes créés avant la désactivation : approuver et reprendre l'essai si la fenêtre
 * de 15 jours n'est pas encore expirée.
 */
export async function syncAutoEcoleWhenVerificationDisabled(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<AutoEcole | null> {
  if (isVerificationDocumentsEnabled()) return null

  const ae = await db.autoEcole.findUnique({ where: { id: autoEcoleId } })
  if (!ae) return null

  const now = new Date()
  const data: {
    verificationStatus?: "APPROVED"
    verificationRejectionReason?: null
    subscriptionStatus?: "TRIAL"
    trialEndsAt?: Date
  } = {}

  if (PENDING_STATUSES.has(ae.verificationStatus)) {
    data.verificationStatus = "APPROVED"
    data.verificationRejectionReason = null
  }

  if (ae.subscriptionStatus === "EXPIRED" && PENDING_STATUSES.has(ae.verificationStatus)) {
    if (ae.trialEndsAt > now) {
      data.subscriptionStatus = "TRIAL"
    } else {
      data.subscriptionStatus = "TRIAL"
      data.trialEndsAt = getTrialEndsAt(now)
    }
  }

  if (Object.keys(data).length === 0) return ae

  return db.autoEcole.update({
    where: { id: autoEcoleId },
    data,
  })
}
