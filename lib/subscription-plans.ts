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
  ESSENTIEL_CONNECT: {
    id: "ESSENTIEL_CONNECT" as const,
    label: "Essentiel Connect",
    description: "Essentiel + inscription en ligne",
    annualDzd: 15_500,
    monthlyDzd: 1_550,
    annualFromMonthlyDzd: 18_600,
    annualSavingsVsMonthlyDzd: 3_100,
  },
  PRO: {
    id: "PRO" as const,
    label: "Pro",
    description: "École structurée — jusqu'à 300 dossiers",
    annualDzd: 22_000,
    monthlyDzd: 2_200,
    annualFromMonthlyDzd: 26_400,
    annualSavingsVsMonthlyDzd: 4_400,
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
  if (plan === "ESSENTIEL_CONNECT") return SUBSCRIPTION_PRICING.ESSENTIEL_CONNECT.label
  if (plan === "PRO") return SUBSCRIPTION_PRICING.PRO.label
  return SUBSCRIPTION_PRICING.ELITE.label
}

export function formatDzdAmount(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} DZD`
}
