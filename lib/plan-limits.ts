import type { SubscriptionStatus } from "@prisma/client"

import { ApiError } from "@/lib/api/errors"

/** Nombre max d'élèves pendant l'essai gratuit. */
export const TRIAL_MAX_ELEVES = 10

export function isTrialSubscription(status: SubscriptionStatus): boolean {
  return status === "TRIAL"
}

export function getTrialMaxEleves(): number {
  return TRIAL_MAX_ELEVES
}

export function assertCanAddEleveOnPlan(
  subscriptionStatus: SubscriptionStatus,
  currentEleveCount: number,
): void {
  if (!isTrialSubscription(subscriptionStatus)) return
  if (currentEleveCount < TRIAL_MAX_ELEVES) return

  throw new ApiError(
    403,
    `Limite de l'essai gratuit atteinte (${TRIAL_MAX_ELEVES} élèves maximum). Passez à Autovia Pro pour en ajouter davantage.`,
    "TRIAL_ELEVE_LIMIT",
  )
}
