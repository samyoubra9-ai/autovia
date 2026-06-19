import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client"

/** Inscription en ligne (pré-inscriptions vitrine) — packs Essentiel et Pro (et Élite). */
export function hasOnlineInscriptionFeature(
  status: SubscriptionStatus,
  plan: SubscriptionPlan | null | undefined,
): boolean {
  if (status !== "ACTIVE") return false
  if (plan === "PRO" || plan === "ESSENTIEL" || plan === "ELITE") return true
  // ACTIVE sans plan explicite → équivalent Essentiel
  return plan == null
}

export function onlineInscriptionPlanLabel(): string {
  return "Essentiel ou Pro"
}
