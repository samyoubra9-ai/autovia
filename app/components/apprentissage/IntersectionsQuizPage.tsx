"use client"

import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { isIntersectionsUnlocked } from "@/lib/apprentissage/access"
import { INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
import { getIntersectionsHref } from "@/lib/apprentissage/tracks/routes"

import { TrackQuiz } from "./TrackQuiz"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function IntersectionsQuizPage() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, saveIntersectionsQuiz } = useApprentissageProgress()

  const unlocked = hydrated ? isIntersectionsUnlocked(progress) : true
  const best = hydrated ? progress.intersections.quizBestScore : null

  const questions = INTERSECTIONS.quizQuestions.slice(
    0,
    INTERSECTIONS.quiz.questionsPerRound,
  )

  if (!unlocked) {
    return (
      <div className="ap-page ap-page--centered">
        <Lock className="size-10 text-muted-foreground" />
        <h1>{INTERSECTIONS.title}</h1>
        <p className="text-muted-foreground">{m.tracks.intersectionsLocked}</p>
        <Button asChild variant="outline">
          <Link href="/apprendre">{m.shell.backHome}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="ap-page ap-quiz-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={getIntersectionsHref()}>
            <ArrowLeft className="size-4" />
            {m.tracks.backToIntersections}
          </Link>
        </Button>
      </div>

      <header className="ap-page-head">
        <h1>
          {formatApprentissageMessage(m.quiz.title, {
            module: INTERSECTIONS.title,
          })}
        </h1>
        <p>{m.tracks.intersectionsQuizIntro}</p>
        {best !== null ? (
          <p className="ap-quiz-meta">
            {formatApprentissageMessage(m.quiz.bestScore, { score: best })}
          </p>
        ) : null}
      </header>

      <TrackQuiz
        questions={questions}
        passPercent={INTERSECTIONS.quiz.passPercent}
        backHref={getIntersectionsHref()}
        continueHref="/apprendre"
        onComplete={(score) =>
          saveIntersectionsQuiz(score, INTERSECTIONS.quiz.passPercent)
        }
      />
    </div>
  )
}
