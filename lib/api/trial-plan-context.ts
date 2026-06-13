import type { SubscriptionStatus } from "@prisma/client"

import { ApiError } from "@/lib/api/errors"
import {
  isTrialPrintBlocked,
  isTrialSubscription,
  TRIAL_MAX_ELEVES,
  TRIAL_MAX_LISTES_EXAMEN,
  TRIAL_MAX_MONITEURS,
  TRIAL_MAX_PAIEMENTS,
} from "@/lib/plan-limits"
import type { PrismaDb } from "@/lib/prisma"

export type TrialPlanSnapshot = {
  isTrial: boolean
  printBlocked: boolean
  maxEleves: number | null
  maxMoniteurs: number | null
  maxPaiements: number | null
  maxListesExamen: number | null
  currentMoniteurs: number
  currentPaiements: number
  currentListesExamen: number
}

export async function loadTrialPlanSnapshot(
  db: PrismaDb,
  autoEcoleId: string,
  subscriptionStatus: SubscriptionStatus,
): Promise<TrialPlanSnapshot> {
  const isTrial = isTrialSubscription(subscriptionStatus)

  const [currentMoniteurs, currentPaiements, currentListesExamen] =
    await Promise.all([
      db.moniteur.count({ where: { autoEcoleId } }),
      db.paiement.count({ where: { autoEcoleId } }),
      db.listeExamen.count({ where: { autoEcoleId } }),
    ])

  return {
    isTrial,
    printBlocked: isTrialPrintBlocked(subscriptionStatus),
    maxEleves: isTrial ? TRIAL_MAX_ELEVES : null,
    maxMoniteurs: isTrial ? TRIAL_MAX_MONITEURS : null,
    maxPaiements: isTrial ? TRIAL_MAX_PAIEMENTS : null,
    maxListesExamen: isTrial ? TRIAL_MAX_LISTES_EXAMEN : null,
    currentMoniteurs,
    currentPaiements,
    currentListesExamen,
  }
}

export async function assertCanAddMoniteurOnPlan(
  db: PrismaDb,
  autoEcoleId: string,
  subscriptionStatus: SubscriptionStatus,
): Promise<void> {
  if (!isTrialSubscription(subscriptionStatus)) return

  const current = await db.moniteur.count({ where: { autoEcoleId } })
  if (current >= TRIAL_MAX_MONITEURS) {
    throw new ApiError(
      403,
      `Limite d'essai atteinte : ${TRIAL_MAX_MONITEURS} moniteur maximum. Passez à un abonnement pour en ajouter.`,
      "TRIAL_MONITEUR_LIMIT",
    )
  }
}

export async function assertCanAddPaiementOnPlan(
  db: PrismaDb,
  autoEcoleId: string,
  subscriptionStatus: SubscriptionStatus,
): Promise<void> {
  if (!isTrialSubscription(subscriptionStatus)) return

  const current = await db.paiement.count({ where: { autoEcoleId } })
  if (current >= TRIAL_MAX_PAIEMENTS) {
    throw new ApiError(
      403,
      `Limite d'essai atteinte : ${TRIAL_MAX_PAIEMENTS} paiement enregistré pour tester. Passez à un abonnement pour en ajouter.`,
      "TRIAL_PAIEMENT_LIMIT",
    )
  }
}

export async function assertCanCreateListeExamenOnPlan(
  db: PrismaDb,
  autoEcoleId: string,
  subscriptionStatus: SubscriptionStatus,
): Promise<void> {
  if (!isTrialSubscription(subscriptionStatus)) return

  const current = await db.listeExamen.count({ where: { autoEcoleId } })
  if (current >= TRIAL_MAX_LISTES_EXAMEN) {
    throw new ApiError(
      403,
      `Limite d'essai atteinte : ${TRIAL_MAX_LISTES_EXAMEN} liste d'examen pour découvrir la fonctionnalité. Passez à un abonnement pour en créer d'autres.`,
      "TRIAL_LISTE_EXAMEN_LIMIT",
    )
  }
}

export function assertCanPrintOnPlan(subscriptionStatus: SubscriptionStatus): void {
  if (!isTrialPrintBlocked(subscriptionStatus)) return

  throw new ApiError(
    403,
    "L'impression est désactivée pendant l'essai gratuit. Vous pouvez consulter les résultats à l'écran ; passez à un abonnement pour imprimer.",
    "TRIAL_PRINT_BLOCKED",
  )
}
