import type { SubscriptionStatus } from "@prisma/client"

export { assertCanAddEleveOnPlan, buildEleveQuotaSnapshot, resolveEleveQuota } from "@/lib/eleve-quota"
export type { EleveQuotaInput, EleveQuotaSnapshot } from "@/lib/eleve-quota"

/** Nombre max d'élèves pendant l'essai gratuit. */
export const TRIAL_MAX_ELEVES = 10

export function isTrialSubscription(status: SubscriptionStatus): boolean {
  return status === "TRIAL"
}

export function getTrialMaxEleves(): number {
  return TRIAL_MAX_ELEVES
}
