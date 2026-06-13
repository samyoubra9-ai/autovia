import type { SubscriptionStatus } from "@prisma/client"

export { assertCanAddEleveOnPlan, buildEleveQuotaSnapshot, resolveEleveQuota } from "@/lib/eleve-quota"
export type { EleveQuotaInput, EleveQuotaSnapshot } from "@/lib/eleve-quota"

/** Nombre max d'élèves pendant l'essai gratuit. */
export const TRIAL_MAX_ELEVES = 10

/** Nombre max de moniteurs pendant l'essai gratuit. */
export const TRIAL_MAX_MONITEURS = 1

/** Nombre max de paiements enregistrés pendant l'essai gratuit. */
export const TRIAL_MAX_PAIEMENTS = 1

/** Nombre max de listes d'examen pendant l'essai gratuit. */
export const TRIAL_MAX_LISTES_EXAMEN = 1

export function isTrialSubscription(status: SubscriptionStatus): boolean {
  return status === "TRIAL"
}

export function isTrialPrintBlocked(status: SubscriptionStatus): boolean {
  return isTrialSubscription(status)
}

export function getTrialMaxEleves(): number {
  return TRIAL_MAX_ELEVES
}
