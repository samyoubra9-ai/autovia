import type {
  BillingPeriod,
  Prisma,
  SubscriptionBillingRecord,
  SubscriptionPlan,
} from "@prisma/client"

import type { SiteAdminAccessAction } from "@/lib/api/site-admin-access-update"
import { SUBSCRIPTION_PRICING } from "@/lib/subscription-plans"
import { subscriptionPlanLabel } from "@/lib/subscription-plans"

export type BillingRecordInput = {
  autoEcoleId: string
  siteAdminId?: string | null
  subscriptionPlan?: SubscriptionPlan | null
  amountDzd?: number | null
  billingPeriod: BillingPeriod
  paidUntil?: Date | null
  reference?: string | null
  notes?: string | null
  accessAction: SiteAdminAccessAction | string
}

export type BillingRecordDto = {
  id: string
  subscriptionPlan: SubscriptionPlan | null
  subscriptionPlanLabel: string
  amountDzd: number | null
  amountLabel: string
  billingPeriod: BillingPeriod
  billingPeriodLabel: string
  paidUntil: string | null
  reference: string | null
  notes: string | null
  accessAction: string
  accessActionLabel: string
  createdAt: string
}

const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  ANNUAL: "Annuel",
  MONTHLY: "Mensuel",
  TRIAL: "Essai",
  COMPLIMENTARY: "Gratuit / offert",
  CUSTOM: "Sur mesure",
}

const ACCESS_ACTION_LABELS: Record<string, string> = {
  unlock_paid: "Activation payée",
  resume_paid: "Reprise abonnement",
  trial_new: "Nouvel essai",
  extend_trial: "Prolongation essai",
  resume_trial: "Reprise essai",
  block: "Blocage",
  cancel: "Annulation",
}

export function billingPeriodLabel(period: BillingPeriod): string {
  return BILLING_PERIOD_LABELS[period] ?? period
}

export function accessActionLabel(action: string): string {
  return ACCESS_ACTION_LABELS[action] ?? action
}

export function formatBillingAmount(amountDzd: number | null | undefined): string {
  if (amountDzd == null) return "—"
  if (amountDzd === 0) return "Gratuit"
  return `${amountDzd.toLocaleString("fr-FR")} DZD`
}

export function resolveDefaultBillingAmount(
  plan: SubscriptionPlan | null | undefined,
  period: BillingPeriod,
): number | null {
  if (period === "COMPLIMENTARY" || period === "TRIAL") return 0
  if (!plan || plan === "ELITE") return null
  const pricing = SUBSCRIPTION_PRICING[plan]
  if (period === "MONTHLY") return pricing.monthlyDzd
  if (period === "ANNUAL") return pricing.annualDzd
  return null
}

export function parseBillingPeriod(raw: unknown): BillingPeriod {
  const value = String(raw ?? "ANNUAL").toUpperCase()
  if (value === "MONTHLY") return "MONTHLY"
  if (value === "TRIAL") return "TRIAL"
  if (value === "COMPLIMENTARY") return "COMPLIMENTARY"
  if (value === "CUSTOM") return "CUSTOM"
  return "ANNUAL"
}

export function parseBillingAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Montant facturation invalide.")
  }
  return Math.round(n)
}

export function toBillingRecordDto(row: SubscriptionBillingRecord): BillingRecordDto {
  return {
    id: row.id,
    subscriptionPlan: row.subscriptionPlan,
    subscriptionPlanLabel: subscriptionPlanLabel(row.subscriptionPlan),
    amountDzd: row.amountDzd,
    amountLabel: formatBillingAmount(row.amountDzd),
    billingPeriod: row.billingPeriod,
    billingPeriodLabel: billingPeriodLabel(row.billingPeriod),
    paidUntil: row.paidUntil?.toISOString().slice(0, 10) ?? null,
    reference: row.reference,
    notes: row.notes,
    accessAction: row.accessAction,
    accessActionLabel: accessActionLabel(row.accessAction),
    createdAt: row.createdAt.toISOString(),
  }
}

export async function createSubscriptionBillingRecord(
  tx: Prisma.TransactionClient,
  input: BillingRecordInput,
): Promise<SubscriptionBillingRecord> {
  return tx.subscriptionBillingRecord.create({
    data: {
      autoEcoleId: input.autoEcoleId,
      siteAdminId: input.siteAdminId ?? null,
      subscriptionPlan: input.subscriptionPlan ?? null,
      amountDzd: input.amountDzd ?? null,
      billingPeriod: input.billingPeriod,
      paidUntil: input.paidUntil ?? null,
      reference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
      accessAction: input.accessAction,
    },
  })
}

export function shouldRecordBillingOnAccessAction(
  action: SiteAdminAccessAction,
  recordBilling?: boolean,
): boolean {
  if (recordBilling === false) return false
  return action === "unlock_paid" || action === "resume_paid"
}

export function buildBillingRecordFromAccessPatch(
  action: SiteAdminAccessAction,
  body: {
    subscriptionPlan?: SubscriptionPlan | null
    paidUntil?: string | null
    billingPeriod?: BillingPeriod | string | null
    billingAmountDzd?: number | null
    billingReference?: string | null
    billingNotes?: string | null
  },
  patch: {
    subscriptionPlan: SubscriptionPlan | null
    paidUntil: Date | null
  },
): BillingRecordInput | null {
  if (!shouldRecordBillingOnAccessAction(action)) return null

  const plan = patch.subscriptionPlan ?? body.subscriptionPlan ?? null
  const billingPeriod = parseBillingPeriod(body.billingPeriod)
  const amountDzd =
    body.billingAmountDzd !== undefined
      ? body.billingAmountDzd
      : resolveDefaultBillingAmount(plan, billingPeriod)

  return {
    autoEcoleId: "",
    subscriptionPlan: plan,
    amountDzd,
    billingPeriod,
    paidUntil: patch.paidUntil,
    reference: body.billingReference,
    notes: body.billingNotes,
    accessAction: action,
  }
}
