import type { Metadata } from "next"
import Link from "next/link"
import { BookOpen, ChevronRight, Plus } from "lucide-react"

import {
  LearningDbSetupNotice,
  LearningEmptyModulesNotice,
} from "@/app/components/admin/learning/LearningDbSetupNotice"
import { listLearningModulesForAdmin } from "@/lib/learning/queries"

export const metadata: Metadata = {
  title: "Contenu apprentissage",
  robots: { index: false, follow: false },
}

export default async function ApprentissageAdminPage() {
  let modules
  try {
    modules = await listLearningModulesForAdmin()
  } catch {
    return <LearningDbSetupNotice />
  }

  const totalChapters = modules.reduce((n, m) => n + m.chapters.length, 0)
  const publishedChapters = modules.reduce(
    (n, m) => n + m.chapters.filter((c) => c.published).length,
    0,
  )

  return (
    <div className="admin-page">
      <header className="admin-page-head admin-page-head--split">
        <div>
          <p className="admin-page-kicker">Espace pédagogique</p>
          <h1 className="admin-page-title">Contenu apprentissage</h1>
          <p className="admin-page-desc">
            Contenu des leçons dans <code>content/apprentissage/*.json</code> — images
            dans <code>public/panneaux/</code>.
          </p>
        </div>
        <Link href="/admin/apprentissage/new" className="admin-btn admin-btn--primary">
          <Plus className="size-4" aria-hidden />
          Nouveau module
        </Link>
      </header>

      <div className="admin-stats-row">
        <div className="admin-stat">
          <span className="admin-stat-value">{modules.length}</span>
          <span className="admin-stat-label">Modules</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{totalChapters}</span>
          <span className="admin-stat-label">Leçons</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-value">{publishedChapters}</span>
          <span className="admin-stat-label">Publiées</span>
        </div>
      </div>

      {modules.length === 0 ? (
        <LearningEmptyModulesNotice />
      ) : (
        <div className="admin-module-grid">
          {modules.map((mod) => {
            const published = mod.chapters.filter((c) => c.published).length
            return (
              <Link
                key={mod.id}
                href={`/admin/apprentissage/${mod.slug}`}
                className="admin-module-card"
              >
                <div className="admin-module-card-top">
                  <span className="admin-module-step">Étape {mod.step}</span>
                  {!mod.published && (
                    <span className="admin-badge admin-badge-blocked">Brouillon</span>
                  )}
                </div>
                <h2>{mod.titleFr}</h2>
                {mod.subtitleFr && <p className="admin-module-sub">{mod.subtitleFr}</p>}
                <div className="admin-module-card-meta">
                  <BookOpen className="size-4" aria-hidden />
                  {mod.chapters.length} leçon{mod.chapters.length !== 1 ? "s" : ""} ·{" "}
                  {published} publiée{published !== 1 ? "s" : ""}
                </div>
                <ChevronRight className="admin-module-card-arrow size-5" aria-hidden />
              </Link>
            )
          })}
        </div>
      )}

      <section className="admin-panel admin-panel--hint">
        <h2>Première utilisation</h2>
        <ol className="admin-steps-list">
          <li>
            Éditer <code>content/apprentissage/chapitre-1.json</code> (titres, texte HTML,
            images).
          </li>
          <li>
            Déposer les images dans <code>public/panneaux/</code> et référencer{" "}
            <code>/panneaux/…</code> dans le champ <code>images</code> de chaque leçon.
          </li>
          <li>
            Régénérer le squelette :{" "}
            <code>node scripts/generate-apprentissage-chapitre-1-json.mjs</code>
          </li>
        </ol>
        <Link href="/apprendre" className="admin-btn admin-btn--ghost">
          Voir l&apos;espace apprenant
        </Link>
      </section>
    </div>
  )
}
