"use client"

import Link from "next/link"
import { ArrowRight, Check, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { getChapterContent } from "@/lib/i18n/apprentissage-content"
import {
  getModuleAccessState,
  getModuleCompletionPercent,
  isModuleUnlocked,
} from "@/lib/apprentissage/access"
import {
  getChapterHref,
  getModule,
  getQuizHref,
} from "@/lib/apprentissage/curriculum"
import type { ModuleSlug } from "@/lib/apprentissage/types"
import { cn } from "@/lib/utils"

import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function ModuleOverview({ moduleSlug }: { moduleSlug: ModuleSlug }) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const mod = getModule(moduleSlug)
  const moduleMessages = m.modules[moduleSlug]
  const { progress, hydrated } = useApprentissageProgress()

  const unlocked = hydrated ? isModuleUnlocked(moduleSlug, progress) : moduleSlug === "fondamentaux"
  const state = hydrated
    ? getModuleAccessState(moduleSlug, progress)
    : moduleSlug === "fondamentaux"
      ? "available"
      : "locked"
  const percent = hydrated ? getModuleCompletionPercent(moduleSlug, progress) : 0

  if (!unlocked) {
    return (
      <div className="ap-page ap-page--centered">
        <Lock className="size-10 text-muted-foreground" />
        <h1>{moduleMessages.title}</h1>
        <p className="text-muted-foreground">{m.module.quizLocked}</p>
        <Button asChild variant="outline">
          <Link href="/apprendre">{m.shell.backHome}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="ap-page">
      <header className="ap-page-head">
        <Badge>
          {formatApprentissageMessage(m.module.stepLabel, { step: mod.step })}
        </Badge>
        <h1>{moduleMessages.title}</h1>
        <p>{moduleMessages.description}</p>
        <div className="ap-progress-track ap-progress-track--lg">
          <div className="ap-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <section>
        <h2 className="ap-section-title">{m.module.chaptersTitle}</h2>
        <div className="ap-chapter-grid">
          {mod.chapterSlugs.map((chapterSlug, index) => {
            const chapter = getChapterContent(m, moduleSlug, chapterSlug)
            const done = progress.modules[moduleSlug].chaptersCompleted.includes(
              chapterSlug,
            )

            return (
              <Card key={chapterSlug} className="ap-chapter-card">
                <CardHeader className="gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                    {done ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : null}
                  </div>
                  <CardTitle className="text-base">{chapter.title}</CardTitle>
                  <CardDescription>{chapter.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={getChapterHref(moduleSlug, chapterSlug)}>
                      {m.module.chapterCta}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <Card
        className={cn(
          "ap-quiz-card",
          state === "completed" && "ap-quiz-card--done",
        )}
      >
        <CardHeader>
          <CardTitle>{m.module.quizCardTitle}</CardTitle>
          <CardDescription>{m.module.quizCardText}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={getQuizHref(moduleSlug)}>
              {m.module.quizCta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
