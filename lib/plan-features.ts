import type { PrismaClient } from "@prisma/client"
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client"

import { ApiError } from "@/lib/api/errors"

/** Inscription en ligne (pré-inscriptions vitrine) — Essentiel Connect, Pro et Élite. */
export function hasOnlineInscriptionFeature(
  status: SubscriptionStatus,
  plan: SubscriptionPlan | null | undefined,
): boolean {
  if (status !== "ACTIVE") return false
  if (plan === "PRO" || plan === "ESSENTIEL_CONNECT" || plan === "ELITE") return true
  return false
}

export function onlineInscriptionPlanLabel(): string {
  return "Essentiel Connect ou Pro"
}

export async function assertOnlineInscriptionForAutoEcole(
  prisma: Pick<PrismaClient, "autoEcole">,
  autoEcoleId: string,
): Promise<void> {
  const ae = await prisma.autoEcole.findUnique({
    where: { id: autoEcoleId },
    select: { subscriptionStatus: true, subscriptionPlan: true },
  })
  if (!ae || !hasOnlineInscriptionFeature(ae.subscriptionStatus, ae.subscriptionPlan)) {
    throw new ApiError(
      403,
      `Les inscriptions en ligne sont disponibles avec les packs ${onlineInscriptionPlanLabel()}.`,
      "ONLINE_INSCRIPTION_PLAN_REQUIRED",
    )
  }
}
