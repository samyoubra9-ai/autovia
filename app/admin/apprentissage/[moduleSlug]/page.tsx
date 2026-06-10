import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, Plus } from "lucide-react"

import { updateLearningModule } from "@/app/admin/apprentissage/actions"
import {
  LearningDbSetupNotice,
} from "@/app/components/admin/learning/LearningDbSetupNotice"
import { ModuleEditForm } from "@/app/components/admin/learning/ModuleEditForm"
import { getLearningModuleForAdmin } from "@/lib/learning/queries"

type PageProps = {
  params: Promise<{ moduleSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug } = await params
  try {
    const mod = await getLearningModuleForAdmin(moduleSlug)
    return { title: mod ? `Module — ${mod.titleFr}` : "Module" }
  } catch {
    return { title: "Module" }
  }
}

export default async function ModuleAdminPage({ params }: PageProps) {
  const { moduleSlug } = await params

  let mod
  try {
    mod = await getLearningModuleForAdmin(moduleSlug)
  } catch {
    return <LearningDbSetupNotice />
  }

  if (!mod) notFound()

  const updateAction = updateLearningModule.bind(null, moduleSlug)

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link href="/admin/apprentissage">Contenu apprentissage</Link>
        <span aria-hidden>/</span>
        <span>{mod.titleFr}</span>
      </nav>

      <header className="admin-page-head admin-page-head--split">
        <div>
          <p className="admin-page-kicker">Étape {mod.step}</p>
          <h1 className="admin-page-title">{mod.titleFr}</h1>
          <p className="admin-page-desc">
            Slug : <code>{mod.slug}</code>
          </p>
        </div>
        <Link
          href={`/apprendre/${mod.slug}`}
          className="admin-btn admin-btn--ghost"
          target="_blank"
        >
          <ExternalLink className="size-4" aria-hidden />
          Aperçu public
        </Link>
      </header>

      <div className="admin-split">
        <section className="admin-panel">
          <h2>Paramètres du module</h2>
          <ModuleEditForm
            initial={{
              titleFr: mod.titleFr,
              titleKab: mod.titleKab ?? "",
              subtitleFr: mod.subtitleFr ?? "",
              subtitleKab: mod.subtitleKab ?? "",
              descriptionFr: mod.descriptionFr ?? "",
              descriptionKab: mod.descriptionKab ?? "",
              published: mod.published,
            }}
            action={updateAction}
          />
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Leçons ({mod.chapters.length})</h2>
            <Link
              href={`/admin/apprentissage/${mod.slug}/chapters/new`}
              className="admin-btn-sm admin-btn-sm-primary"
            >
              <Plus className="size-3.5" aria-hidden />
              Nouvelle leçon
            </Link>
          </div>

          {mod.chapters.length === 0 ? (
            <p className="admin-empty">Aucune leçon. Créez la première.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Leçon</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {mod.chapters.map((ch) => (
                    <tr key={ch.id}>
                      <td>{ch.sortOrder}</td>
                      <td>
                        <strong>{ch.titleFr}</strong>
                        <p className="admin-meta">
                          <code>{ch.slug}</code>
                        </p>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            ch.published ? "admin-badge-active" : "admin-badge-blocked"
                          }`}
                        >
                          {ch.published ? "Publiée" : "Brouillon"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/apprentissage/${mod.slug}/chapters/${ch.slug}`}
                          className="admin-btn-sm"
                        >
                          Éditer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
