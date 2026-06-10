import type { Metadata } from "next"
import Link from "next/link"

import { createLearningModule } from "@/app/admin/apprentissage/actions"
import { LearningDbSetupNotice } from "@/app/components/admin/learning/LearningDbSetupNotice"
import { ModuleCreateForm } from "@/app/components/admin/learning/ModuleCreateForm"
import { listLearningModulesForAdmin } from "@/lib/learning/queries"

export const metadata: Metadata = {
  title: "Nouveau module",
  robots: { index: false, follow: false },
}

export default async function NewModulePage() {
  let modules
  try {
    modules = await listLearningModulesForAdmin()
  } catch {
    return <LearningDbSetupNotice />
  }

  const nextStep =
    modules.length > 0 ? Math.max(...modules.map((m) => m.step)) + 1 : 1

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link href="/admin/apprentissage">Contenu apprentissage</Link>
        <span aria-hidden>/</span>
        <span>Nouveau module</span>
      </nav>

      <header className="admin-page-head">
        <h1 className="admin-page-title">Nouveau module</h1>
        <p className="admin-page-desc">
          Créez une étape du parcours, puis ajoutez des leçons à l&apos;intérieur.
        </p>
      </header>

      <section className="admin-panel">
        <ModuleCreateForm
          existingSlugs={modules.map((m) => m.slug)}
          nextStep={nextStep}
          action={createLearningModule}
        />
      </section>
    </div>
  )
}
