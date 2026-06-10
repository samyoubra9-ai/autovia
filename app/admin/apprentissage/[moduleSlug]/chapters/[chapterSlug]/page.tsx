import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { LearningDbSetupNotice } from "@/app/components/admin/learning/LearningDbSetupNotice"
import { ChapterForm } from "@/app/components/admin/learning/ChapterForm"
import { getLearningChapterForAdmin } from "@/lib/learning/queries"
import { parseImagesJson } from "@/lib/learning/validation"

type PageProps = {
  params: Promise<{ moduleSlug: string; chapterSlug: string }>
  searchParams: Promise<{ saved?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug, chapterSlug } = await params
  try {
    const ch = await getLearningChapterForAdmin(moduleSlug, chapterSlug)
    return { title: ch ? `Éditer — ${ch.titleFr}` : "Éditer la leçon" }
  } catch {
    return { title: "Éditer la leçon" }
  }
}

export default async function EditChapterPage({ params, searchParams }: PageProps) {
  const { moduleSlug, chapterSlug } = await params
  const { saved } = await searchParams

  let chapter
  try {
    chapter = await getLearningChapterForAdmin(moduleSlug, chapterSlug)
  } catch {
    return <LearningDbSetupNotice />
  }

  if (!chapter) notFound()

  const images = parseImagesJson(chapter.imagesJson)

  return (
    <div className="admin-page">
      <nav className="admin-breadcrumb">
        <Link href="/admin/apprentissage">Contenu</Link>
        <span aria-hidden>/</span>
        <Link href={`/admin/apprentissage/${moduleSlug}`}>{chapter.module.titleFr}</Link>
        <span aria-hidden>/</span>
        <span>{chapter.titleFr}</span>
      </nav>

      <header className="admin-page-head admin-page-head--split">
        <div>
          <h1 className="admin-page-title">Éditer la leçon</h1>
          <p className="admin-page-desc">
            <code>{chapter.slug}</code> · ordre {chapter.sortOrder}
          </p>
        </div>
        {chapter.published && (
          <Link
            href={`/apprendre/${moduleSlug}/${chapterSlug}`}
            className="admin-btn admin-btn--ghost"
            target="_blank"
          >
            <ExternalLink className="size-4" aria-hidden />
            Voir en ligne
          </Link>
        )}
      </header>

      {saved === "1" && (
        <p className="admin-alert admin-alert-success">Leçon créée — complétez le contenu.</p>
      )}

      <section className="admin-panel">
        <ChapterForm
          mode="edit"
          moduleSlug={moduleSlug}
          chapterSlug={chapterSlug}
          chapterId={chapter.id}
          initial={{
            sortOrder: chapter.sortOrder,
            titleFr: chapter.titleFr,
            titleKab: chapter.titleKab ?? "",
            summaryFr: chapter.summaryFr ?? "",
            summaryKab: chapter.summaryKab ?? "",
            bodyFr: chapter.bodyFr ?? "",
            bodyKab: chapter.bodyKab ?? "",
            published: chapter.published,
            images,
          }}
        />
      </section>
    </div>
  )
}
