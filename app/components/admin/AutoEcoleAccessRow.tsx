"use client"

import { useMemo, useState, useTransition } from "react"

import { updateAutoEcoleAccess } from "@/app/admin/actions"
import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import { SUBSCRIPTION_PRICING, subscriptionPlanLabel } from "@/lib/subscription-plans"
import type { BillingPeriod, SubscriptionPlan, SubscriptionStatus, VerificationStatus } from "@prisma/client"

export type BillingRecordRow = {
  id: string
  subscriptionPlanLabel: string
  amountLabel: string
  billingPeriodLabel: string
  paidUntil: string | null
  reference: string | null
  accessActionLabel: string
  createdAt: string
}

export type AutoEcoleRowData = {
  id: string
  nom: string
  ville: string | null
  emailContact: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan | null
  trialEndsAt: string
  paidUntil: string | null
  verificationStatus?: VerificationStatus
  adminNotes: string | null
  owner: { prenom: string; nom: string; email: string } | null
  billingRecords: BillingRecordRow[]
}

function badgeClass(status: SubscriptionStatus, hasAccess: boolean) {
  if (hasAccess && status === "ACTIVE") return "admin-badge admin-badge-active"
  if (hasAccess && status === "TRIAL") return "admin-badge admin-badge-trial"
  if (status === "CANCELLED") return "admin-badge admin-badge-cancelled"
  return "admin-badge admin-badge-blocked"
}

function defaultAmount(plan: SubscriptionPlan, period: BillingPeriod): number | null {
  if (plan === "ELITE") return null
  if (period === "MONTHLY") return SUBSCRIPTION_PRICING[plan].monthlyDzd
  if (period === "ANNUAL") return SUBSCRIPTION_PRICING[plan].annualDzd
  if (period === "COMPLIMENTARY") return 0
  return SUBSCRIPTION_PRICING[plan].annualDzd
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR")
}

export function AutoEcoleAccessRow({ row }: { row: AutoEcoleRowData }) {
  const [pending, startTransition] = useTransition()
  const [paidPlan, setPaidPlan] = useState<SubscriptionPlan>(
    row.subscriptionPlan ?? "ESSENTIEL",
  )
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("ANNUAL")
  const [amountDzd, setAmountDzd] = useState<string>(() => {
    const plan = row.subscriptionPlan ?? "ESSENTIEL"
    const amt = defaultAmount(plan, "ANNUAL")
    return amt == null ? "" : String(amt)
  })
  const [reference, setReference] = useState("")
  const [paidUntilInput, setPaidUntilInput] = useState(
    row.paidUntil?.slice(0, 10) ?? "",
  )
  const [showBilling, setShowBilling] = useState(false)

  const autoEcole = {
    subscriptionStatus: row.subscriptionStatus,
    trialEndsAt: new Date(row.trialEndsAt),
    paidUntil: row.paidUntil ? new Date(row.paidUntil) : null,
    verificationStatus: row.verificationStatus ?? "APPROVED",
  }
  const hasAccess = hasAutoEcoleAccess(autoEcole)

  const suggestedAmount = useMemo(
    () => defaultAmount(paidPlan, billingPeriod),
    [paidPlan, billingPeriod],
  )

  function run(
    status: SubscriptionStatus,
    extra?: {
      paidUntil?: string | null
      adminNotes?: string
      subscriptionPlan?: SubscriptionPlan
      billingPeriod?: BillingPeriod
      billingAmountDzd?: number | null
      billingReference?: string | null
      recordBilling?: boolean
    },
  ) {
    startTransition(async () => {
      await updateAutoEcoleAccess({
        autoEcoleId: row.id,
        subscriptionStatus: status,
        ...extra,
      })
    })
  }

  function unlockPaid() {
    const parsedAmount =
      amountDzd.trim() === "" ? suggestedAmount : Math.max(0, Math.round(Number(amountDzd)))
    run("ACTIVE", {
      subscriptionPlan: paidPlan,
      paidUntil: paidUntilInput || null,
      billingPeriod,
      billingAmountDzd: Number.isFinite(parsedAmount) ? parsedAmount : null,
      billingReference: reference.trim() || null,
      recordBilling: true,
    })
  }

  return (
    <>
      <tr>
        <td>
          <strong>{row.nom}</strong>
          {row.ville && <div className="admin-meta">{row.ville}</div>}
          {row.owner && (
            <div className="admin-meta">
              {row.owner.prenom} {row.owner.nom} — {row.owner.email}
            </div>
          )}
        </td>
        <td>
          <span className={badgeClass(row.subscriptionStatus, hasAccess)}>
            {hasAccess ? "Accès OK" : "Bloqué"}
          </span>
          <div className="admin-meta">{getAccessDetail(autoEcole)}</div>
          {row.subscriptionStatus === "ACTIVE" && row.subscriptionPlan && (
            <div className="admin-meta">Plan : {subscriptionPlanLabel(row.subscriptionPlan)}</div>
          )}
          {row.billingRecords.length > 0 && (
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => setShowBilling((v) => !v)}
            >
              {showBilling ? "Masquer" : "Voir"} facturation ({row.billingRecords.length})
            </button>
          )}
        </td>
        <td>
          <div className="admin-billing-block">
            <p className="admin-billing-title">Activation & facturation</p>
            <div className="admin-actions">
              <select
                className="admin-notes-input"
                style={{ maxWidth: 140 }}
                value={paidPlan}
                onChange={(e) => {
                  const plan = e.target.value as SubscriptionPlan
                  setPaidPlan(plan)
                  const amt = defaultAmount(plan, billingPeriod)
                  if (amt != null) setAmountDzd(String(amt))
                }}
                title="Plan commercial"
              >
                <option value="ESSENTIEL">Essentiel</option>
                <option value="PRO">Pro</option>
                <option value="ELITE">Élite</option>
              </select>
              <select
                className="admin-notes-input"
                style={{ maxWidth: 130 }}
                value={billingPeriod}
                onChange={(e) => {
                  const period = e.target.value as BillingPeriod
                  setBillingPeriod(period)
                  const amt = defaultAmount(paidPlan, period)
                  if (amt != null) setAmountDzd(String(amt))
                }}
                title="Période facturation"
              >
                <option value="ANNUAL">Annuel</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="COMPLIMENTARY">Offert</option>
                <option value="CUSTOM">Sur mesure</option>
              </select>
            </div>
            <div className="admin-actions" style={{ marginTop: 8 }}>
              <input
                type="number"
                className="admin-notes-input"
                style={{ maxWidth: 120 }}
                placeholder="Montant DZD"
                value={amountDzd}
                onChange={(e) => setAmountDzd(e.target.value)}
                min={0}
              />
              <input
                type="text"
                className="admin-notes-input"
                style={{ maxWidth: 140 }}
                placeholder="Réf. facture"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
              <input
                type="date"
                className="admin-notes-input"
                style={{ maxWidth: 160 }}
                title="Fin d'abonnement"
                value={paidUntilInput}
                onChange={(e) => setPaidUntilInput(e.target.value)}
              />
            </div>
            <div className="admin-actions" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="admin-btn-sm admin-btn-sm-primary"
                disabled={pending}
                onClick={unlockPaid}
              >
                Débloquer & enregistrer
              </button>
              <button
                type="button"
                className="admin-btn-sm"
                disabled={pending}
                onClick={() => run("TRIAL", { recordBilling: false })}
              >
                Essai 15 j
              </button>
              <button
                type="button"
                className="admin-btn-sm admin-btn-sm-danger"
                disabled={pending}
                onClick={() => run("EXPIRED", { recordBilling: false })}
              >
                Bloquer
              </button>
            </div>
            <input
              type="text"
              className="admin-notes-input"
              style={{ marginTop: 8 }}
              placeholder="Note interne"
              defaultValue={row.adminNotes ?? ""}
              onBlur={(e) =>
                run(row.subscriptionStatus, {
                  adminNotes: e.target.value,
                  recordBilling: false,
                })
              }
            />
          </div>
        </td>
      </tr>
      {showBilling && row.billingRecords.length > 0 ? (
        <tr>
          <td colSpan={3}>
            <div className="admin-billing-history">
              <table className="admin-table admin-table-compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Période</th>
                    <th>Montant</th>
                    <th>Fin accès</th>
                    <th>Réf.</th>
                  </tr>
                </thead>
                <tbody>
                  {row.billingRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>{formatDate(rec.createdAt)}</td>
                      <td>{rec.subscriptionPlanLabel}</td>
                      <td>{rec.billingPeriodLabel}</td>
                      <td>{rec.amountLabel}</td>
                      <td>{rec.paidUntil ? formatDate(rec.paidUntil) : "—"}</td>
                      <td>{rec.reference ?? rec.accessActionLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}
