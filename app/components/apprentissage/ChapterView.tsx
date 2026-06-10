"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getChapterContent } from "@/lib/i18n/apprentissage-content"
import { isModuleUnlocked } from "@/lib/apprentissage/access"
import {
  getChapterHref,
  getModule,
  getModuleHref,
  getQuizHref,
} from "@/lib/apprentissage/curriculum"
import type { LessonContentDto } from "@/lib/learning/types"
import type { ChapterSlug, ModuleSlug } from "@/lib/apprentissage/types"

import { LessonBody } from "./LessonBody"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function ChapterView({
  moduleSlug,
  chapterSlug,
  lesson,
}: {
  moduleSlug: ModuleSlug
  chapterSlug: ChapterSlug
  lesson?: LessonContentDto | null
}) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const mod = getModule(moduleSlug)
  const moduleMessages = m.modules[moduleSlug]
  const fallback = getChapterContent(m, moduleSlug, chapterSlug)
  const chapter = lesson
    ? { title: lesson.title || fallback.title, summary: lesson.summary || fallback.summary }
    : fallback
  const hasLessonContent =
    lesson &&
    ((lesson.body && lesson.body.trim().length > 0) || lesson.images.length > 0)
  const { progress, hydrated, completeChapter } = useApprentissageProgress()

  const unlocked = hydrated
    ? isModuleUnlocked(moduleSlug, progress)
    : moduleSlug === "fondamentaux"
  const done = progress.modules[moduleSlug].chaptersCompleted.includes(
    chapterSlug,
  )

  const chapterIndex = mod.chapterSlugs.indexOf(chapterSlug)
  const nextChapterSlug = mod.chapterSlugs[chapterIndex + 1]

  if (!unlocked) {
    return (
      <div className="ap-page ap-page--centered">
        <Lock className="size-10 text-muted-foreground" />
        <h1>{chapter.title}</h1>
        <p className="text-muted-foreground">{m.module.quizLocked}</p>
        <Button asChild variant="outline">
          <Link href="/apprendre">{m.shell.backHome}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="ap-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={getModuleHref(moduleSlug)}>
            <ArrowLeft className="size-4" />
            {m.chapter.backToModule}
          </Link>
        </Button>
      </div>

      <header className="ap-page-head">
        <p className="text-sm text-muted-foreground">{moduleMessages.title}</p>
        <h1>{chapter.title}</h1>
        <p>{chapter.summary}</p>
      </header>

      {hasLessonContent ? (
        <Card className="ap-lesson-card">
          <CardContent className="pt-6">
            <LessonBody body={lesson!.body} images={lesson!.images} />
          </CardContent>
        </Card>
      ) : (
        <Card className="ap-lesson-placeholder">
          <CardHeader>
            <CardTitle className="text-base">Leçon</CardTitle>
            <CardDescription>{m.module.chapterPlaceholder}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-48 rounded-lg border border-dashed bg-muted/30" />
        </Card>
      )}

      <div className="ap-chapter-actions">
        <Button
          type="button"
          variant={done ? "secondary" : "default"}
          disabled={done}
          onClick={() => completeChapter(moduleSlug, chapterSlug)}
          className="gap-2"
        >
          {done ? (
            <>
              <Check className="size-4" />
              {m.chapter.markedComplete}
            </>
          ) : (
            m.chapter.markComplete
          )}
        </Button>

        {nextChapterSlug ? (
          <Button asChild variant="outline">
            <Link href={getChapterHref(moduleSlug, nextChapterSlug)}>
              {m.chapter.nextChapter}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={getQuizHref(moduleSlug)}>
              {m.chapter.goToQuiz}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
