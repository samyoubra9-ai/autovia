import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { LearningDbSetupNotice } from "@/app/components/admin/learning/LearningDbSetupNotice"
import { ChapterForm } from "@/app/components/admin/learning/ChapterForm"
import { getLearningModuleForAdmin } from "@/lib/learning/queries"

type PageProps = {
  params: Promise<{ moduleSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug } = await params
  try {
    const mod = await getLearningModuleForAdmin(moduleSlug)
    return { title: mod ? `Nouvelle leçon — ${mod.titleFr}` : "Nouvelle leçon" }
  } catch {
    return { title: "Nouvelle leçon" }
  }
}

export default async function NewChapterPage({ params }: PageProps) {
  const { moduleSlug } = await params

  let mod
  try {
    mod = await getLearningModuleForAdmin(moduleSlug)
  } catch {
    return <LearningDbSetupNotice />
  }

  if (!mod) notFound()

  const nextOrder =
    mod.chapters.length > 0
      ? Math.max(...mod.chapters.map((c) => c.sortOrder)) + 1
      : 1

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link href="/admin/apprentissage">Contenu</Link>
        <span aria-hidden>/</span>
        <Link href={`/admin/apprentissage/${mod.slug}`}>{mod.titleFr}</Link>
        <span aria-hidden>/</span>
        <span>Nouvelle leçon</span>
      </nav>

      <header className="admin-page-head">
        <h1 className="admin-page-title">Nouvelle leçon</h1>
        <p className="admin-page-desc">Module : {mod.titleFr}</p>
      </header>

      <section className="admin-panel">
        <ChapterForm
          mode="create"
          moduleSlug={mod.slug}
          initial={{
            sortOrder: nextOrder,
            titleFr: "",
            titleKab: "",
            summaryFr: "",
            summaryKab: "",
            bodyFr: "",
            bodyKab: "",
            published: false,
            images: [],
          }}
        />
      </section>
    </div>
  )
}
