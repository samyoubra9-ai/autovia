import type { SubscriptionPlan } from "@prisma/client"

/** Tarifs publics (DZD) — paiement annuel moins cher que 12 mois. */
export const SUBSCRIPTION_PRICING = {
  ESSENTIEL: {
    id: "ESSENTIEL" as const,
    label: "Essentiel",
    description: "Petite auto-école — jusqu'à 100 dossiers",
    annualDzd: 12_000,
    monthlyDzd: 1_200,
    /** Coût si facturé 12 mois au tarif mensuel */
    annualFromMonthlyDzd: 14_400,
    annualSavingsVsMonthlyDzd: 2_400,
  },
  PRO: {
    id: "PRO" as const,
    label: "Pro",
    description: "École structurée — jusqu'à 300 dossiers",
    annualDzd: 20_000,
    monthlyDzd: 2_084,
    annualFromMonthlyDzd: 25_000,
    annualSavingsVsMonthlyDzd: 5_000,
  },
  ELITE: {
    id: "ELITE" as const,
    label: "Élite / Sur mesure",
    description: "Volume illimité — tarif et options à négocier",
    negotiable: true as const,
  },
} as const

export function subscriptionPlanLabel(plan: SubscriptionPlan | null | undefined): string {
  if (!plan) return "Non défini"
  if (plan === "ESSENTIEL") return SUBSCRIPTION_PRICING.ESSENTIEL.label
  if (plan === "PRO") return SUBSCRIPTION_PRICING.PRO.label
  return SUBSCRIPTION_PRICING.ELITE.label
}

export function formatDzdAmount(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DZD`
}
