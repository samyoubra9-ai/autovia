"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ClipboardList } from "lucide-react"
import { useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import {
  getIntersectionsProgressPercent,
  isIntersectionsUnlocked,
} from "@/lib/apprentissage/access"
import { INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
import {
  getIntersectionTypeHref,
  getIntersectionsQuizHref,
} from "@/lib/apprentissage/tracks/routes"
import { cn } from "@/lib/utils"

import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function IntersectionsOverview() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const unlocked = hydrated ? isIntersectionsUnlocked(progress) : true
  const percent = hydrated ? getIntersectionsProgressPercent(progress) : 0
  const quizPassed = hydrated ? progress.intersections.quizPassed : false
  const best = hydrated ? progress.intersections.quizBestScore : null

  return (
    <div className="ap-page">
      <header className="ap-page-head">
        <Badge>{m.tracks.intersections.badge}</Badge>
        <h1>{INTERSECTIONS.title}</h1>
        <p>{INTERSECTIONS.description}</p>
        <div className="ap-page-head-meta">
          <span>{percent}% {m.tracks.studied}</span>
          {best !== null ? (
            <span>
              {formatApprentissageMessage(m.quiz.bestScore, { score: best })}
            </span>
          ) : null}
        </div>
      </header>

      {!unlocked ? (
        <p className="ap-track-locked-hint">{m.tracks.intersectionsLocked}</p>
      ) : null}

      <section className="ap-track-section">
        <h2>{m.tracks.typesTitle}</h2>
        <ol className="ap-type-list">
          {INTERSECTIONS.types.map((type, index) => {
            const studied = hydrated
              ? progress.intersections.typesStudied.includes(type.slug)
              : false

            return (
              <li key={type.slug}>
                {unlocked ? (
                  <Link
                    href={getIntersectionTypeHref(type.slug)}
                    className={cn(
                      "ap-type-card",
                      studied && "ap-type-card--studied",
                    )}
                  >
                    <span className="ap-type-card-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{type.title}</h3>
                      <p>{type.summary}</p>
                    </div>
                    {studied ? (
                      <Check className="size-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ArrowRight className="size-4 shrink-0 opacity-40" />
                    )}
                  </Link>
                ) : (
                  <div className="ap-type-card ap-type-card--locked">
                    <span className="ap-type-card-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{type.title}</h3>
                      <p>{type.summary}</p>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {unlocked ? (
        <section className="ap-track-quiz-card">
          <div className="ap-track-quiz-card-icon">
            <ClipboardList className="size-6" aria-hidden />
          </div>
          <div>
            <h2>{m.tracks.quizCardTitle}</h2>
            <p>
              {formatApprentissageMessage(m.tracks.intersectionsQuizText, {
                count: INTERSECTIONS.quiz.questionsPerRound,
                score: INTERSECTIONS.quiz.passPercent,
              })}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href={getIntersectionsQuizHref()}>
              {quizPassed ? m.tracks.retakeQuiz : m.module.quizCta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      ) : null}
    </div>
  )
}

type IntersectionTypeViewProps = {
  typeSlug: string
}

export function IntersectionTypeView({ typeSlug }: IntersectionTypeViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, studyIntersection } = useApprentissageProgress()
  const type = INTERSECTIONS.types.find((t) => t.slug === typeSlug)

  useEffect(() => {
    if (type) studyIntersection(type.slug)
  }, [type, studyIntersection])

  if (!type) return null

  const studied = hydrated
    ? progress.intersections.typesStudied.includes(type.slug)
    : false

  return (
    <div className="ap-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href="/apprendre/intersections">
            <ArrowLeft className="size-4" />
            {m.tracks.backToIntersections}
          </Link>
        </Button>
      </div>

      <header className="ap-page-head">
        <Badge>{m.tracks.intersections.badge}</Badge>
        <h1>{type.title}</h1>
        <p>{type.summary}</p>
        {studied ? (
          <p className="ap-studied-badge">
            <Check className="size-3.5" />
            {m.tracks.typeStudied}
          </p>
        ) : null}
      </header>

      <div
        className="ap-lesson-body"
        dangerouslySetInnerHTML={{ __html: type.body }}
      />

      {type.rules.length > 0 ? (
        <section className="ap-rules-box">
          <h2>{m.tracks.rulesTitle}</h2>
          <ul>
            {type.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="ap-page-footer-cta">
        <Button asChild variant="outline">
          <Link href={getIntersectionsQuizHref()}>
            {m.chapter.goToQuiz}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
