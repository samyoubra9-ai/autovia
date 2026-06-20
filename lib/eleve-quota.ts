import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client"

import { ApiError } from "@/lib/api/errors"
import { isTrialSubscription, TRIAL_MAX_ELEVES } from "@/lib/plan-limits"

/** Catégories « semi-remorque » — bloc +60 dossiers chacune. */
export const REMORQUE_PERMIS_CODES = new Set(["BE", "CE", "DE", "C1E"])

export const ESSENTIEL_QUOTA = 100
/** @deprecated Utiliser ESSENTIEL_QUOTA */
export const ESSENTIEL_QUOTA_FLOOR = ESSENTIEL_QUOTA
/** @deprecated Utiliser ESSENTIEL_QUOTA */
export const ESSENTIEL_QUOTA_CAP = ESSENTIEL_QUOTA
export const PRO_QUOTA = 300

export function isRemorquePermisCode(code: string): boolean {
  return REMORQUE_PERMIS_CODES.has(code.trim().toUpperCase())
}

/** Quota calculé depuis les catégories actives (sans plan commercial). */
export function quotaFromCategoryCodes(codes: string[]): number {
  const normalized = [
    ...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean)),
  ]
  const standard = normalized.filter((c) => !isRemorquePermisCode(c))
  const remorque = normalized.filter((c) => isRemorquePermisCode(c))

  let total = 0
  if (standard.length > 0) {
    total += 60 + (standard.length - 1) * 20
  }
  total += remorque.length * 60
  return total
}

export function applySubscriptionPlanToQuota(
  formulaQuota: number,
  plan: SubscriptionPlan | null | undefined,
): number | null {
  if (plan === "ELITE") return null

  if (plan === "PRO") {
    return PRO_QUOTA
  }

  // Essentiel (ou ACTIVE sans plan explicite) — plafond fixe
  return ESSENTIEL_QUOTA
}

export type EleveQuotaInput = {
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan | null
  maxElevesOverride: number | null
  activeCategoryCodes: string[]
  currentEleveCount: number
}

export type EleveQuotaSnapshot = {
  maxEleves: number | null
  currentEleves: number
  remaining: number | null
  formulaQuota: number
  subscriptionPlan: SubscriptionPlan | null
  isTrial: boolean
  isUnlimited: boolean
}

export function resolveEleveQuota(input: Omit<EleveQuotaInput, "currentEleveCount">): {
  maxEleves: number | null
  formulaQuota: number
  isTrial: boolean
  isUnlimited: boolean
} {
  if (input.maxElevesOverride != null && input.maxElevesOverride > 0) {
    return {
      maxEleves: input.maxElevesOverride,
      formulaQuota: quotaFromCategoryCodes(input.activeCategoryCodes),
      isTrial: false,
      isUnlimited: false,
    }
  }

  if (isTrialSubscription(input.subscriptionStatus)) {
    return {
      maxEleves: TRIAL_MAX_ELEVES,
      formulaQuota: quotaFromCategoryCodes(input.activeCategoryCodes),
      isTrial: true,
      isUnlimited: false,
    }
  }

  const formulaQuota = quotaFromCategoryCodes(input.activeCategoryCodes)
  const maxEleves = applySubscriptionPlanToQuota(formulaQuota, input.subscriptionPlan)

  return {
    maxEleves,
    formulaQuota,
    isTrial: false,
    isUnlimited: maxEleves === null,
  }
}

export function buildEleveQuotaSnapshot(input: EleveQuotaInput): EleveQuotaSnapshot {
  const resolved = resolveEleveQuota(input)
  return {
    maxEleves: resolved.maxEleves,
    currentEleves: input.currentEleveCount,
    remaining:
      resolved.maxEleves === null
        ? null
        : Math.max(0, resolved.maxEleves - input.currentEleveCount),
    formulaQuota: resolved.formulaQuota,
    subscriptionPlan: input.subscriptionPlan,
    isTrial: resolved.isTrial,
    isUnlimited: resolved.isUnlimited,
  }
}

export function assertCanAddEleveOnPlan(input: EleveQuotaInput): void {
  if (input.subscriptionStatus !== "ACTIVE" && !isTrialSubscription(input.subscriptionStatus)) {
    throw new ApiError(
      403,
      "Abonnement inactif. Contactez Autovia pour réactiver votre accès.",
      "SUBSCRIPTION_INACTIVE",
    )
  }

  const { maxEleves, isTrial } = resolveEleveQuota(input)

  if (maxEleves === null) return

  if (input.currentEleveCount >= maxEleves) {
    const hint = isTrial
      ? "Passez à un abonnement Essentiel, Essentiel Connect ou Pro pour ajouter plus de candidats."
      : "Passez au plan Pro ou contactez Autovia pour augmenter votre quota."
    throw new ApiError(
      403,
      `Limite de dossiers atteinte (${maxEleves} maximum, ${input.currentEleveCount} enregistrés). ${hint}`,
      "ELEVE_QUOTA_LIMIT",
    )
  }
}
