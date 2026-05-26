"use client"

import { useTransition } from "react"

import { updateAutoEcoleAccess } from "@/app/admin/actions"
import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import type { SubscriptionStatus } from "@prisma/client"

export type AutoEcoleRowData = {
  id: string
  nom: string
  ville: string | null
  emailContact: string | null
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string
  paidUntil: string | null
  adminNotes: string | null
  owner: { prenom: string; nom: string; email: string } | null
}

function badgeClass(status: SubscriptionStatus, hasAccess: boolean) {
  if (hasAccess && status === "ACTIVE") return "admin-badge admin-badge-active"
  if (hasAccess && status === "TRIAL") return "admin-badge admin-badge-trial"
  if (status === "CANCELLED") return "admin-badge admin-badge-cancelled"
  return "admin-badge admin-badge-blocked"
}

export function AutoEcoleAccessRow({ row }: { row: AutoEcoleRowData }) {
  const [pending, startTransition] = useTransition()

  const autoEcole = {
    subscriptionStatus: row.subscriptionStatus,
    trialEndsAt: new Date(row.trialEndsAt),
    paidUntil: row.paidUntil ? new Date(row.paidUntil) : null,
  }
  const hasAccess = hasAutoEcoleAccess(autoEcole)

  function run(
    status: SubscriptionStatus,
    extra?: { paidUntil?: string | null; adminNotes?: string },
  ) {
    startTransition(async () => {
      await updateAutoEcoleAccess({
        autoEcoleId: row.id,
        subscriptionStatus: status,
        ...extra,
      })
    })
  }

  return (
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
      </td>
      <td>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn-sm admin-btn-sm-primary"
            disabled={pending}
            onClick={() => run("ACTIVE")}
          >
            Débloquer (payé)
          </button>
          <button
            type="button"
            className="admin-btn-sm"
            disabled={pending}
            onClick={() => run("TRIAL")}
          >
            Essai 15 j
          </button>
          <button
            type="button"
            className="admin-btn-sm admin-btn-sm-danger"
            disabled={pending}
            onClick={() => run("EXPIRED")}
          >
            Bloquer
          </button>
        </div>
        <input
          type="date"
          className="admin-notes-input"
          style={{ marginTop: 8, maxWidth: 160 }}
          title="Fin d'abonnement (optionnel)"
          defaultValue={row.paidUntil?.slice(0, 10) ?? ""}
          onBlur={(e) => {
            const v = e.target.value
            if (v && row.subscriptionStatus === "ACTIVE") {
              run("ACTIVE", { paidUntil: v })
            }
          }}
        />
        <input
          type="text"
          className="admin-notes-input"
          placeholder="Note interne"
          defaultValue={row.adminNotes ?? ""}
          onBlur={(e) => run(row.subscriptionStatus, { adminNotes: e.target.value })}
        />
      </td>
    </tr>
  )
}
