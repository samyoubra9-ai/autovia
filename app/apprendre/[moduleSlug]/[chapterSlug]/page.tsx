import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { ChapterView } from "@/app/components/apprentissage/ChapterView"
import { isChapterInModule, isModuleSlug } from "@/lib/apprentissage/curriculum"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getChapterContent } from "@/lib/i18n/apprentissage-content"
import { getLessonContentFromDb } from "@/lib/learning/queries"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import type { ChapterSlug, ModuleSlug } from "@/lib/apprentissage/types"

type PageProps = {
  params: Promise<{ moduleSlug: string; chapterSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug, chapterSlug } = await params
  if (!isModuleSlug(moduleSlug) || !isChapterInModule(moduleSlug, chapterSlug)) {
    return {}
  }

  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)
  const lesson = await getLessonContentFromDb(moduleSlug, chapterSlug, locale)
  const chapter = lesson
    ? { title: lesson.title, summary: lesson.summary }
    : getChapterContent(m, moduleSlug as ModuleSlug, chapterSlug as ChapterSlug)

  return {
    title: chapter.title,
    description: chapter.summary,
  }
}

export default async function ChapterPage({ params }: PageProps) {
  const { moduleSlug, chapterSlug } = await params
  if (!isModuleSlug(moduleSlug) || !isChapterInModule(moduleSlug, chapterSlug)) {
    notFound()
  }

  const locale = getVitrineLocaleFromCookie(await cookies())
  const lesson = await getLessonContentFromDb(moduleSlug, chapterSlug, locale)

  return (
    <ChapterView
      moduleSlug={moduleSlug}
      chapterSlug={chapterSlug as ChapterSlug}
      lesson={lesson}
    />
  )
}
