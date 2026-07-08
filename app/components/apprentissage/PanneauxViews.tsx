"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, ClipboardList, Minus, RotateCcw } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import {
  getPanneauxCategoryPercent,
  getPanneauxFamilyPercent,
  getPanneauxProgressPercent,
  getPanneauxSectionPercent,
} from "@/lib/apprentissage/access"
import {
  categoryHasSections,
  familyHasFlatSigns,
  getCategorySignCount,
  getFamilySignCount,
  getFamilySigns,
  getPanneauCategoryInFamily,
  getPanneauFamily,
  getPanneauSection,
  PANNEAUX,
} from "@/lib/apprentissage/tracks/content"
import {
  getPanneauCategoryHref,
  getPanneauFamilyHref,
  getPanneauSectionHref,
  getPanneauxQuizHref,
} from "@/lib/apprentissage/tracks/routes"
import { getNextPanneauStep } from "@/lib/apprentissage/tracks/navigation"
import { sectionProgressKey, signKey } from "@/lib/apprentissage/tracks/types"
import { cn } from "@/lib/utils"

import { CATEGORY_COLORS, FAMILY_COLORS } from "./track-ui"
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
        <h2>{m.tracks.familiesTitle}</h2>
        <div className="ap-category-grid">
          {PANNEAUX.families.map((family) => {
            const colors = FAMILY_COLORS[family.slug] ?? {
              accent: "#2563eb",
              soft: "#eff6ff",
            }
            const signCount = familyHasFlatSigns(family)
              ? getFamilySignCount(family)
              : (family.categories ?? []).reduce(
                  (n, cat) => n + getCategorySignCount(cat),
                  0,
                )
            const familyPercent = hydrated
              ? getPanneauxFamilyPercent(family.slug, progress)
              : 0

            return (
              <Link
                key={family.slug}
                href={getPanneauFamilyHref(family.slug)}
                className="ap-category-card"
                style={
                  {
                    "--ap-cat-accent": colors.accent,
                    "--ap-cat-soft": colors.soft,
                  } as React.CSSProperties
                }
              >
                <div className="ap-category-card-head">
                  <h3>{family.title}</h3>
                </div>
                <p>{family.description}</p>
                <div className="ap-category-card-foot">
                  {!familyHasFlatSigns(family) ? (
                    <span>
                      {formatApprentissageMessage(m.tracks.categoriesCount, {
                        count: family.categories?.length ?? 0,
                      })}
                    </span>
                  ) : null}
                  <span>
                    {formatApprentissageMessage(m.tracks.signsCount, {
                      count: signCount,
                    })}
                  </span>
                </div>
                <div className="ap-category-card-foot">
                  <span className="ap-category-card-pct">{familyPercent}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill"
                    style={{ width: `${familyPercent}%` }}
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

type PanneauFamilyViewProps = {
  familySlug: string
}

type PanneauFlatFamilyViewProps = {
  family: NonNullable<ReturnType<typeof getPanneauFamily>>
  m: ReturnType<typeof getApprentissageMessages>
}

function PanneauFlatFamilyView({ family, m }: PanneauFlatFamilyViewProps) {
  const { progress, hydrated, studySign, unstudySign } = useApprentissageProgress()
  const signs = getFamilySigns(family)
  const isHorizontal = family.slug === "horizontal"
  const imageVariant = isHorizontal ? "horizontal" : "default"
  const colors = FAMILY_COLORS[family.slug] ?? {
    accent: "#64748b",
    soft: "#f8fafc",
  }
  const categorySlug = family.slug
  const familyPercent = hydrated
    ? getPanneauxFamilyPercent(family.slug, progress)
    : 0
  const emptyMessage = isHorizontal
    ? m.tracks.horizontalEmpty
    : m.tracks.flatFamilyEmpty

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
        <Badge>{family.title}</Badge>
        <h1>{family.title}</h1>
        <p>{family.description}</p>
        <div className="ap-page-head-meta">
          <span>{familyPercent}% {m.tracks.studied}</span>
          <span>
            {formatApprentissageMessage(m.tracks.signsCount, {
              count: signs.length,
            })}
          </span>
        </div>
      </header>

      {signs.length === 0 ? (
        <p className="ap-flat-family-empty">{emptyMessage}</p>
      ) : (
        <div
          className={cn(
            "ap-sign-grid",
            isHorizontal && "ap-sign-grid--horizontal",
          )}
        >
          {signs.map((sign) => {
            const studied = hydrated
              ? progress.panneaux.signsStudied.includes(
                  signKey(categorySlug, sign.id),
                )
              : false
            const displayName = sign.name.trim()
            const displayMeaning = sign.meaning.trim()

            return (
              <article
                key={sign.id}
                className={cn("ap-sign-card", studied && "ap-sign-card--studied")}
                style={
                  {
                    "--ap-cat-accent": colors.accent,
                    "--ap-cat-soft": colors.soft,
                  } as React.CSSProperties
                }
              >
                <div className="ap-sign-card-image">
                  <PanneauSignImage
                    src={sign.image}
                    alt={displayName || m.tracks.signUntitled}
                    variant={imageVariant}
                  />
                  {studied ? (
                    <span className="ap-sign-card-studied-badge">
                      <Check className="size-3.5" aria-hidden />
                      {m.tracks.signStudied}
                    </span>
                  ) : null}
                </div>
                <div className="ap-sign-card-body">
                  {displayName ? <h3>{displayName}</h3> : null}
                  {displayMeaning ? <p>{displayMeaning}</p> : null}
                  <div className="ap-sign-card-actions">
                    {studied ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="ap-sign-card-btn ap-sign-card-btn--unread"
                        onClick={() => unstudySign(categorySlug, sign.id)}
                      >
                        <RotateCcw className="size-4" aria-hidden />
                        {m.tracks.markUnread}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="default"
                        size="lg"
                        className="ap-sign-card-btn ap-sign-card-btn--read"
                        onClick={() => studySign(categorySlug, sign.id)}
                      >
                        <BookOpenCheck className="size-4" aria-hidden />
                        {m.chapter.markComplete}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <PanneauStepFooter
        familySlug={family.slug}
        categorySlug={categorySlug}
      />
    </div>
  )
}

export function PanneauFamilyView({ familySlug }: PanneauFamilyViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const family = getPanneauFamily(familySlug)

  if (!family) return null

  if (familyHasFlatSigns(family)) {
    return <PanneauFlatFamilyView family={family} m={m} />
  }

  const colors = FAMILY_COLORS[family.slug] ?? {
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
        <Badge>{family.title}</Badge>
        <h1>{family.title}</h1>
        <p>{family.description}</p>
      </header>

      <section className="ap-track-section">
        <h2>{m.tracks.categoriesTitle}</h2>
        <div className="ap-category-grid">
          {(family.categories ?? []).map((cat) => {
            const catColors = CATEGORY_COLORS[cat.slug] ?? colors
            const catPercent = hydrated
              ? getPanneauxCategoryPercent(cat.slug, progress)
              : 0
            const done = hydrated
              ? progress.panneaux.categoriesCompleted.includes(cat.slug) ||
                (cat.sections?.every((section) =>
                  progress.panneaux.categoriesCompleted.includes(
                    sectionProgressKey(cat.slug, section.slug),
                  ),
                ) ??
                  false)
              : false

            return (
              <Link
                key={cat.slug}
                href={getPanneauCategoryHref(family.slug, cat.slug)}
                className="ap-category-card"
                style={
                  {
                    "--ap-cat-accent": catColors.accent,
                    "--ap-cat-soft": catColors.soft,
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
                      count: getCategorySignCount(cat),
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
    </div>
  )
}

type PanneauCategoryHubViewProps = {
  familySlug: string
  categorySlug: string
}

export function PanneauCategoryHubView({
  familySlug,
  categorySlug,
}: PanneauCategoryHubViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const family = getPanneauFamily(familySlug)
  const cat = getPanneauCategoryInFamily(familySlug, categorySlug)

  if (!family || !cat || !categoryHasSections(cat)) return null

  const colors = CATEGORY_COLORS[cat.slug] ?? FAMILY_COLORS[family.slug] ?? {
    accent: "#2563eb",
    soft: "#eff6ff",
  }

  return (
    <div className="ap-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={getPanneauFamilyHref(family.slug)}>
            <ArrowLeft className="size-4" />
            {family.title}
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

      <section className="ap-track-section">
        <h2>{m.tracks.sectionsTitle}</h2>
        <div className="ap-category-grid">
          {cat.sections!.map((section) => {
            const sectionPercent = hydrated
              ? getPanneauxSectionPercent(cat.slug, section.slug, progress)
              : 0
            const done = hydrated
              ? progress.panneaux.categoriesCompleted.includes(
                  sectionProgressKey(cat.slug, section.slug),
                )
              : false

            return (
              <Link
                key={section.slug}
                href={getPanneauSectionHref(
                  family.slug,
                  cat.slug,
                  section.slug,
                )}
                className="ap-category-card"
                style={
                  {
                    "--ap-cat-accent": colors.accent,
                    "--ap-cat-soft": colors.soft,
                  } as React.CSSProperties
                }
              >
                <div className="ap-category-card-head">
                  <h3>{section.title}</h3>
                  {done ? (
                    <Check className="size-4 text-emerald-600" aria-hidden />
                  ) : null}
                </div>
                <p>{section.description}</p>
                <div className="ap-category-card-foot">
                  <span>
                    {formatApprentissageMessage(m.tracks.signsCount, {
                      count: section.signs.length,
                    })}
                  </span>
                  <span className="ap-category-card-pct">{sectionPercent}%</span>
                </div>
                <div className="ap-progress-track">
                  <div
                    className="ap-progress-fill"
                    style={{ width: `${sectionPercent}%` }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <PanneauStepFooter
        familySlug={familySlug}
        categorySlug={categorySlug}
      />
    </div>
  )
}

type PanneauStepFooterProps = {
  familySlug: string
  categorySlug: string
  sectionSlug?: string
}

function PanneauStepFooter({
  familySlug,
  categorySlug,
  sectionSlug,
}: PanneauStepFooterProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const next = getNextPanneauStep(familySlug, categorySlug, sectionSlug)

  if (!next) return null

  return (
    <div className="ap-page-footer-cta">
      <Button asChild size="lg" className="ap-page-footer-next">
        <Link href={next.href}>
          <span className="ap-page-footer-next-text">
            <span className="ap-page-footer-next-kicker">{m.tracks.nextStep}</span>
            <span className="ap-page-footer-next-label">{next.label}</span>
          </span>
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="ap-page-footer-quiz">
        <Link href={getPanneauxQuizHref()}>{m.chapter.goToQuiz}</Link>
      </Button>
    </div>
  )
}

type PanneauCategoryViewProps = {
  familySlug: string
  categorySlug: string
}

export function PanneauCategoryView({
  familySlug,
  categorySlug,
}: PanneauCategoryViewProps) {
  const family = getPanneauFamily(familySlug)
  const cat = getPanneauCategoryInFamily(familySlug, categorySlug)

  if (!family || !cat || categoryHasSections(cat)) return null

  return (
    <PanneauSignsView
      familySlug={familySlug}
      categorySlug={categorySlug}
      categoryTitle={cat.title}
      categoryDescription={cat.description}
      signs={cat.signs ?? []}
      backHref={getPanneauFamilyHref(family.slug)}
      backLabel={family.title}
    />
  )
}

type PanneauSectionViewProps = {
  familySlug: string
  categorySlug: string
  sectionSlug: string
}

export function PanneauSectionView({
  familySlug,
  categorySlug,
  sectionSlug,
}: PanneauSectionViewProps) {
  const family = getPanneauFamily(familySlug)
  const cat = getPanneauCategoryInFamily(familySlug, categorySlug)
  const section = getPanneauSection(categorySlug, sectionSlug)

  if (!family || !cat || !section) return null

  return (
    <PanneauSignsView
      familySlug={familySlug}
      categorySlug={categorySlug}
      sectionSlug={sectionSlug}
      categoryTitle={section.title}
      categoryDescription={section.description}
      signs={section.signs}
      backHref={getPanneauCategoryHref(family.slug, cat.slug)}
      backLabel={cat.title}
    />
  )
}

type PanneauSignsViewProps = {
  familySlug: string
  categorySlug: string
  sectionSlug?: string
  categoryTitle: string
  categoryDescription: string
  signs: Array<{
    id: string
    name: string
    meaning: string
    image: string
  }>
  backHref: string
  backLabel: string
}

function PanneauSignImage({
  src,
  alt,
  variant = "default",
}: {
  src: string
  alt: string
  variant?: "default" | "horizontal"
}) {
  const [failed, setFailed] = useState(false)
  const isHorizontal = variant === "horizontal"
  const dimensions = isHorizontal
    ? { width: 720, height: 200 }
    : { width: 120, height: 120 }

  if (!src.trim() || failed) {
    return (
      <div className="ap-sign-card-placeholder" aria-hidden>
        <Minus className="size-8 opacity-40" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className={cn(
        "ap-sign-card-img",
        isHorizontal && "ap-sign-card-img--horizontal",
      )}
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}

function PanneauSignsView({
  familySlug,
  categorySlug,
  sectionSlug,
  categoryTitle,
  categoryDescription,
  signs,
  backHref,
  backLabel,
}: PanneauSignsViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, studySign, unstudySign } = useApprentissageProgress()

  const colors = CATEGORY_COLORS[categorySlug] ?? {
    accent: "#2563eb",
    soft: "#eff6ff",
  }

  return (
    <div className="ap-page">
      <div className="ap-breadcrumb">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            {backLabel}
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
        <Badge>{categoryTitle}</Badge>
        <h1>{categoryTitle}</h1>
        <p>{categoryDescription}</p>
      </header>

      <div className="ap-sign-grid">
        {signs.map((sign) => {
          const key = signKey(categorySlug, sign.id, sectionSlug)
          const studied = hydrated
            ? progress.panneaux.signsStudied.includes(key)
            : false
          const displayName = sign.name.trim()
          const displayMeaning = sign.meaning.trim()

          return (
            <article
              key={sign.id}
              className={cn("ap-sign-card", studied && "ap-sign-card--studied")}
              style={
                {
                  "--ap-cat-accent": colors.accent,
                  "--ap-cat-soft": colors.soft,
                } as React.CSSProperties
              }
            >
              <div className="ap-sign-card-image">
                <PanneauSignImage
                  src={sign.image}
                  alt={displayName || m.tracks.signUntitled}
                />
                {studied ? (
                  <span className="ap-sign-card-studied-badge">
                    <Check className="size-3.5" aria-hidden />
                    {m.tracks.signStudied}
                  </span>
                ) : null}
              </div>
              <div className="ap-sign-card-body">
                {displayName ? <h3>{displayName}</h3> : null}
                {displayMeaning ? <p>{displayMeaning}</p> : null}
                <div className="ap-sign-card-actions">
                  {studied ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="ap-sign-card-btn ap-sign-card-btn--unread"
                      onClick={() =>
                        unstudySign(categorySlug, sign.id, sectionSlug)
                      }
                    >
                      <RotateCcw className="size-4" aria-hidden />
                      {m.tracks.markUnread}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="ap-sign-card-btn ap-sign-card-btn--read"
                      onClick={() =>
                        studySign(categorySlug, sign.id, sectionSlug)
                      }
                    >
                      <BookOpenCheck className="size-4" aria-hidden />
                      {m.chapter.markComplete}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <PanneauStepFooter
        familySlug={familySlug}
        categorySlug={categorySlug}
        sectionSlug={sectionSlug}
      />
    </div>
  )
}
