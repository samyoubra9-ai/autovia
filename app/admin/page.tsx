import type { Metadata } from "next"
import Link from "next/link"

import { signOut } from "@/app/auth/actions"
import { AutoEcoleAccessRow } from "@/app/components/admin/AutoEcoleAccessRow"
import { CreateAutoEcoleForm } from "@/app/components/admin/CreateAutoEcoleForm"
import { requireSiteAdmin } from "@/lib/admin-auth"
import { toBillingRecordDto } from "@/lib/api/subscription-billing"
import { hasAutoEcoleAccess } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Administration plateforme",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const { siteAdmin } = await requireSiteAdmin()

  const autoEcoles = await prisma.autoEcole.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "OWNER" },
        take: 1,
      },
      subscriptionBillingRecords: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })

  const rows = autoEcoles.map((ae) => ({
    id: ae.id,
    nom: ae.nom,
    ville: ae.ville,
    emailContact: ae.emailContact,
    subscriptionStatus: ae.subscriptionStatus,
    subscriptionPlan: ae.subscriptionPlan,
    trialEndsAt: ae.trialEndsAt.toISOString(),
    paidUntil: ae.paidUntil?.toISOString() ?? null,
    adminNotes: ae.adminNotes,
    owner: ae.users[0]
      ? { prenom: ae.users[0].prenom, nom: ae.users[0].nom, email: ae.users[0].email }
      : null,
    billingRecords: ae.subscriptionBillingRecords.map(toBillingRecordDto),
  }))

  const activeCount = autoEcoles.filter((ae) =>
    hasAutoEcoleAccess({
      subscriptionStatus: ae.subscriptionStatus,
      trialEndsAt: ae.trialEndsAt,
      paidUntil: ae.paidUntil,
    }),
  ).length

  return (
    <div className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Administration Autovia</h1>
            <p className="admin-subtitle">
              Connecté : <strong>{siteAdmin.email}</strong> — {autoEcoles.length} auto-école
              {autoEcoles.length !== 1 ? "s" : ""}, {activeCount} avec accès actif
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <form action={signOut}>
              <button type="submit" className="admin-btn-sm">
                Déconnexion
              </button>
            </form>
            <Link href="/" className="admin-btn-sm">
              Accueil
            </Link>
          </div>
        </header>

        <div className="admin-grid">
          <section className="admin-panel">
            <h2>Nouvelle auto-école</h2>
            <CreateAutoEcoleForm />
          </section>

          <section className="admin-panel">
            <h2>Auto-écoles & accès</h2>
            {rows.length === 0 ? (
              <p className="admin-empty">Aucune auto-école. Créez un compte à gauche.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Établissement</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <AutoEcoleAccessRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="admin-meta" style={{ marginTop: 16 }}>
              <strong>Débloquer & enregistrer</strong> : choisissez le plan, la période et le
              montant — une ligne de facturation est créée automatiquement.{" "}
              <strong>Essai 15 j</strong> : essai gratuit sans facturation.{" "}
              <strong>Bloquer</strong> : coupe l&apos;accès.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
