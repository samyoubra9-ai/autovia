"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { getStudiedSignsPool } from "@/lib/apprentissage/access"
import {
  buildSignQuizQuestions,
  PANNEAUX,
} from "@/lib/apprentissage/tracks/content"
import { getPanneauxHref } from "@/lib/apprentissage/tracks/routes"

import { TrackQuiz } from "./TrackQuiz"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function PanneauxQuizPage() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, savePanneauxQuiz } = useApprentissageProgress()
  const [seed] = useState(() => Date.now())

  const questions = useMemo(() => {
    if (!hydrated) return []
    const pool = getStudiedSignsPool(progress)
    return buildSignQuizQuestions(pool, PANNEAUX.quiz.questionsPerRound)
    // seed forces new shuffle when remounting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, progress, seed])

  const best = hydrated ? progress.panneaux.quizBestScore : null

  return (
    <div className="ap-page ap-quiz-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={getPanneauxHref()}>
            <ArrowLeft className="size-4" />
            {m.tracks.backToPanneaux}
          </Link>
        </Button>
      </div>

      <header className="ap-page-head">
        <h1>
          {formatApprentissageMessage(m.quiz.title, {
            module: PANNEAUX.title,
          })}
        </h1>
        <p>{m.tracks.panneauxQuizIntro}</p>
        {best !== null ? (
          <p className="ap-quiz-meta">
            {formatApprentissageMessage(m.quiz.bestScore, { score: best })}
          </p>
        ) : null}
      </header>

      <TrackQuiz
        questions={questions}
        passPercent={PANNEAUX.quiz.passPercent}
        backHref={getPanneauxHref()}
        continueHref="/apprendre/intersections"
        onComplete={(score) =>
          savePanneauxQuiz(score, PANNEAUX.quiz.passPercent)
        }
      />
    </div>
  )
}
