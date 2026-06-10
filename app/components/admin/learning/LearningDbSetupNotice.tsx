import Link from "next/link"
import { AlertTriangle, FileCode2 } from "lucide-react"

export function LearningDbSetupNotice() {
  return (
    <div className="admin-page">
      <div className="admin-panel admin-panel--alert">
        <div className="admin-alert-icon">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <h1 className="admin-page-title">Tables apprentissage manquantes</h1>
        <p className="admin-page-desc">
          Exécutez le script SQL dans Supabase pour créer les tables{" "}
          <code>learning_modules</code> et <code>learning_chapters</code>, puis rechargez
          cette page.
        </p>
        <p className="admin-hint">
          Fichier : <code>docs/sql/learning-content.sql</code>
        </p>
        <Link href="/admin/apprentissage" className="admin-btn admin-btn--ghost">
          Réessayer
        </Link>
      </div>
    </div>
  )
}

export function LearningEmptyModulesNotice() {
  return (
    <div className="admin-panel admin-panel--alert">
      <FileCode2 className="size-8 text-slate-400" aria-hidden />
      <p className="admin-page-desc">
        Aucun module pour l&apos;instant. Créez votre premier module pour commencer.
      </p>
      <Link href="/admin/apprentissage/new" className="admin-btn admin-btn--primary">
        Créer un module
      </Link>
    </div>
  )
}
