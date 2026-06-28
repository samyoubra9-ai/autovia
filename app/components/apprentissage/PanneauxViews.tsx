"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import {
  getPanneauxCategoryPercent,
  getPanneauxProgressPercent,
} from "@/lib/apprentissage/access"
import { PANNEAUX } from "@/lib/apprentissage/tracks/content"
import {
  getPanneauCategoryHref,
  getPanneauxQuizHref,
} from "@/lib/apprentissage/tracks/routes"
import { signKey } from "@/lib/apprentissage/tracks/types"
import { cn } from "@/lib/utils"

import { CATEGORY_COLORS } from "./track-ui"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function PanneauxOverview() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const percent = hydrated ? getPanneauxProgressPercent(progress) : 0
  const quizPassed = hydrated ? progress.panneaux.quizPassed : false
  const best = hydrated ? progress.panneaux.quizBestScore : null

  return (
    <div className="ap-page">
      <header className="ap-page-head">
        <Badge>{m.tracks.panneaux.badge}</Badge>
        <h1>{PANNEAUX.title}</h1>
        <p>{PANNEAUX.description}</p>
        <div className="ap-page-head-meta">
          <span>{percent}% {m.tracks.studied}</span>
          {best !== null ? (
            <span>
              {formatApprentissageMessage(m.quiz.bestScore, { score: best })}
            </span>
          ) : null}
        </div>
      </header>

      <section className="ap-track-section">
        <h2>{m.tracks.categoriesTitle}</h2>
        <div className="ap-category-grid">
          {PANNEAUX.categories.map((cat) => {
            const colors = CATEGORY_COLORS[cat.slug] ?? {
              accent: "#2563eb",
              soft: "#eff6ff",
            }
            const catPercent = hydrated
              ? getPanneauxCategoryPercent(cat.slug, progress)
              : 0
            const done = hydrated
              ? progress.panneaux.categoriesCompleted.includes(cat.slug)
              : false

            return (
              <Link
                key={cat.slug}
                href={getPanneauCategoryHref(cat.slug)}
                className="ap-category-card"
                style={
                  {
                    "--ap-cat-accent": colors.accent,
                    "--ap-cat-soft": colors.soft,
                  } as React.CSSProperties
                }
              >
                <div className="ap-category-card-head">
                  <h3>{cat.title}</h3>
                  {done ? (
                    <Check className="size-4 text-emerald-600" aria-hidden />
                  ) : null}
                </div>
                <p>{cat.description}</p>
                <div className="ap-category-card-foot">
                  <span>
                    {formatApprentissageMessage(m.tracks.signsCount, {
                      count: cat.signs.length,
                    })}
                  </span>
                  <span className="ap-category-card-pct">{catPercent}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill"
                    style={{ width: `${catPercent}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="ap-track-quiz-card">
        <div className="ap-track-quiz-card-icon">
          <ClipboardList className="size-6" aria-hidden />
        </div>
        <div>
          <h2>{m.tracks.quizCardTitle}</h2>
          <p>
            {formatApprentissageMessage(m.tracks.panneauxQuizText, {
              count: PANNEAUX.quiz.questionsPerRound,
              score: PANNEAUX.quiz.passPercent,
            })}
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href={getPanneauxQuizHref()}>
            {quizPassed ? m.tracks.retakeQuiz : m.module.quizCta}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  )
}

type PanneauCategoryViewProps = {
  categorySlug: string
}

export function PanneauCategoryView({ categorySlug }: PanneauCategoryViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, studySign } = useApprentissageProgress()
  const cat = PANNEAUX.categories.find((c) => c.slug === categorySlug)

  if (!cat) return null

  const colors = CATEGORY_COLORS[cat.slug] ?? {
    accent: "#2563eb",
    soft: "#eff6ff",
  }

  return (
    <div className="ap-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href="/apprendre/panneaux">
            <ArrowLeft className="size-4" />
            {m.tracks.backToPanneaux}
          </Link>
        </Button>
      </div>

      <header
        className="ap-page-head"
        style={
          {
            "--ap-cat-accent": colors.accent,
            "--ap-cat-soft": colors.soft,
          } as React.CSSProperties
        }
      >
        <Badge>{cat.title}</Badge>
        <h1>{cat.title}</h1>
        <p>{cat.description}</p>
      </header>

      <div className="ap-sign-grid">
        {cat.signs.map((sign) => {
          const key = signKey(categorySlug, sign.id)
          const studied = hydrated
            ? progress.panneaux.signsStudied.includes(key)
            : false

          return (
            <article
              key={sign.id}
              className={cn("ap-sign-card", studied && "ap-sign-card--studied")}
            >
              <div className="ap-sign-card-image">
                <Image
                  src={sign.image}
                  alt={sign.name}
                  width={120}
                  height={120}
                  className="ap-sign-card-img"
                  unoptimized
                />
                <span className="ap-sign-card-id">{sign.id}</span>
              </div>
              <div className="ap-sign-card-body">
                <h3>{sign.name}</h3>
                <p>{sign.meaning}</p>
                <Button
                  type="button"
                  variant={studied ? "outline" : "default"}
                  size="sm"
                  className="ap-sign-card-btn"
                  onClick={() => studySign(categorySlug, sign.id)}
                  disabled={studied}
                >
                  {studied ? (
                    <>
                      <Check className="size-3.5" />
                      {m.tracks.signStudied}
                    </>
                  ) : (
                    m.chapter.markComplete
                  )}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      <div className="ap-page-footer-cta">
        <Button asChild variant="outline">
          <Link href={getPanneauxQuizHref()}>
            {m.chapter.goToQuiz}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
