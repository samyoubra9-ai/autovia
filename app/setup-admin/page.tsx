import type { Metadata } from "next"
import Link from "next/link"

import { SetupAdminForm } from "@/app/components/auth/SetupAdminForm"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

import "../auth/auth.css"

export const metadata: Metadata = {
  title: "Configuration administrateur",
  robots: { index: false, follow: false },
}

export default async function SetupAdminPage() {
  const adminCount = await prisma.siteAdmin.count()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const existingProfile = user
    ? await prisma.siteAdmin.findUnique({ where: { supabaseUserId: user.id } })
    : null

  if (existingProfile) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-card-wide">
          <h1 className="auth-title">Compte administrateur prêt</h1>
          <p className="auth-subtitle">
            Votre profil est enregistré. Gérez les modules et leçons du parcours code de la
            route.
          </p>
          <p className="auth-footer">
            <Link href="/admin/apprentissage">Ouvrir l&apos;admin apprentissage</Link>
          </p>
        </div>
      </main>
    )
  }

  if (adminCount > 0) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Configuration terminée</h1>
          <p className="auth-subtitle">
            Un administrateur plateforme existe déjà. Supprimez le dossier{" "}
            <code>app/setup-admin</code>.
          </p>
          <p className="auth-footer">
            <Link href="/signin">Se connecter</Link>
          </p>
        </div>
      </main>
    )
  }

  const finishOnly = Boolean(user?.email)

  return (
    <main className="auth-page">
      <div className="auth-card">
        <SetupAdminForm finishOnly={finishOnly} email={user?.email ?? undefined} />
        {!finishOnly && (
          <p className="auth-footer" style={{ marginTop: 16 }}>
            Déjà confirmé votre e-mail ? <Link href="/signin">Connectez-vous</Link> puis revenez ici.
          </p>
        )}
      </div>
    </main>
  )
}
