"use client"

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { isModuleUnlocked } from "@/lib/apprentissage/access"
import { getModule, getModuleHref } from "@/lib/apprentissage/curriculum"
import { getQuizQuestionCount } from "@/lib/apprentissage/quiz-data"
import type { ModuleSlug } from "@/lib/apprentissage/types"

import { ModuleQuiz } from "./ModuleQuiz"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function QuizShell({ moduleSlug }: { moduleSlug: ModuleSlug }) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const mod = getModule(moduleSlug)
  const moduleMessages = m.modules[moduleSlug]
  const { progress, hydrated } = useApprentissageProgress()

  const unlocked = hydrated
    ? isModuleUnlocked(moduleSlug, progress)
    : moduleSlug === "fondamentaux"

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

  const best = progress.modules[moduleSlug].quizBestScore
  const questionCount = getQuizQuestionCount(moduleSlug)

  return (
    <div className="ap-page ap-quiz-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={getModuleHref(moduleSlug)}>
            <ArrowLeft className="size-4" />
            {m.quiz.backToModule}
          </Link>
        </Button>
      </div>

      <header className="ap-page-head">
        <Badge>
          {formatApprentissageMessage(m.module.stepLabel, { step: mod.step })}
        </Badge>
        <h1>
          {formatApprentissageMessage(m.quiz.title, {
            module: moduleMessages.title,
          })}
        </h1>
        <p>{m.quiz.subtitle}</p>
        <p className="ap-quiz-meta">
          {formatApprentissageMessage(m.quiz.questionCount, {
            count: questionCount,
          })}
          {best !== null
            ? ` · ${formatApprentissageMessage(m.quiz.bestScore, { score: best })}`
            : null}
        </p>
      </header>

      <ModuleQuiz moduleSlug={moduleSlug} />
    </div>
  )
}
