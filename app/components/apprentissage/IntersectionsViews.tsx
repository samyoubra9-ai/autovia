"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  Minus,
  RotateCcw,
} from "lucide-react"
import { useState } from "react"

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
import {
  getIntersectionGroups,
  getIntersectionType,
  INTERSECTIONS,
} from "@/lib/apprentissage/tracks/content"
import { getIntersectionTypesByGroup, getNextIntersectionStep } from "@/lib/apprentissage/tracks/intersections-navigation"
import {
  getIntersectionTypeHref,
  getIntersectionsQuizHref,
} from "@/lib/apprentissage/tracks/routes"
import {
  getIntersectionVehicleLabel,
  getPassingStepBadge,
  INTERSECTION_VEHICLE_COLORS,
  normalizePassingOrder,
} from "@/lib/apprentissage/tracks/intersection-vehicles"
import type { IntersectionScenarioVehicle, IntersectionType } from "@/lib/apprentissage/tracks/types"
import { cn } from "@/lib/utils"

import { useApprentissageProgress } from "./ApprentissageProgressProvider"

function IntersectionMediaImage({
  src,
  alt,
  className,
  variant = "sign",
}: {
  src: string
  alt: string
  className?: string
  variant?: "sign" | "scenario"
}) {
  const [failed, setFailed] = useState(false)
  const isScenario = variant === "scenario"

  if (!src.trim() || failed) {
    return (
      <div
        className={cn(
          "ap-intersection-media-placeholder",
          isScenario && "ap-intersection-media-placeholder--scenario",
          className,
        )}
        aria-hidden
      >
        <Minus className="size-8 opacity-40" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={isScenario ? 720 : 280}
      height={isScenario ? 480 : 200}
      className={cn(
        "ap-intersection-media-img",
        isScenario && "ap-intersection-media-img--scenario",
        className,
      )}
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}

type IntersectionPassingOrderProps = {
  passingOrder: NonNullable<
    NonNullable<IntersectionType["scenario"]>["passingOrder"]
  >
  m: ReturnType<typeof getApprentissageMessages>
}

function IntersectionVehicleChip({
  vehicle,
}: {
  vehicle: IntersectionScenarioVehicle
}) {
  const palette = INTERSECTION_VEHICLE_COLORS[vehicle.color]
  const label = getIntersectionVehicleLabel(vehicle.color, vehicle.label)

  return (
    <span className="ap-intersection-passing-vehicle">
      <span
        className={cn(
          "ap-intersection-vehicle-dot",
          vehicle.color === "white" && "ap-intersection-vehicle-dot--white",
        )}
        style={
          {
            "--ap-vehicle-color": palette.hex,
            "--ap-vehicle-ring": palette.ring,
          } as React.CSSProperties
        }
        aria-hidden
      />
      <span className="ap-intersection-passing-order-label">{label}</span>
    </span>
  )
}

function IntersectionPassingOrder({ passingOrder, m }: IntersectionPassingOrderProps) {
  const steps = normalizePassingOrder(passingOrder)

  return (
    <div className="ap-intersection-passing-order">
      <p className="ap-intersection-passing-order-title">
        {m.tracks.scenarioPassingOrderTitle}
      </p>
      <ol className="ap-intersection-passing-order-list">
        {steps.map((vehicles, stepIndex) => (
          <li
            key={stepIndex}
            className={cn(
              "ap-intersection-passing-order-item",
              stepIndex === 0 && "ap-intersection-passing-order-item--first",
              vehicles.length > 1 && "ap-intersection-passing-order-item--together",
            )}
          >
            <span className="ap-intersection-passing-order-rank">
              {stepIndex + 1}
            </span>
            <div className="ap-intersection-passing-vehicles">
              {vehicles.map((vehicle, vehicleIndex) => (
                <IntersectionVehicleChip
                  key={`${vehicle.color}-${vehicleIndex}`}
                  vehicle={vehicle}
                />
              ))}
            </div>
            <span className="ap-intersection-passing-order-badge">
              {getPassingStepBadge(stepIndex, vehicles.length, m)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

type IntersectionTypeListProps = {
  types: IntersectionType[]
  unlocked: boolean
  hydrated: boolean
  studiedSlugs: string[]
  startIndex?: number
}

function IntersectionTypeList({
  types,
  unlocked,
  hydrated,
  studiedSlugs,
  startIndex = 0,
}: IntersectionTypeListProps) {
  return (
    <ol className="ap-type-list">
      {types.map((type, index) => {
        const studied = hydrated ? studiedSlugs.includes(type.slug) : false

        return (
          <li key={type.slug}>
            {unlocked ? (
              <Link
                href={getIntersectionTypeHref(type.slug)}
                className={cn("ap-type-card", studied && "ap-type-card--studied")}
              >
                <span className="ap-type-card-num">
                  {String(startIndex + index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{type.title}</h3>
                  <p>{type.summary}</p>
                </div>
                {studied ? (
                  <Check className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <ArrowRight className="size-4 shrink-0 opacity-40" />
                )}
              </Link>
            ) : (
              <div className="ap-type-card ap-type-card--locked">
                <span className="ap-type-card-num">
                  {String(startIndex + index + 1).padStart(2, "0")}
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
  )
}

export function IntersectionsOverview() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const unlocked = hydrated ? isIntersectionsUnlocked(progress) : true
  const percent = hydrated ? getIntersectionsProgressPercent(progress) : 0
  const quizPassed = hydrated ? progress.intersections.quizPassed : false
  const best = hydrated ? progress.intersections.quizBestScore : null
  const groups = getIntersectionGroups()
  const studiedSlugs = hydrated ? progress.intersections.typesStudied : []
  let runningIndex = 0

  return (
    <div className="ap-page">
      <header className="ap-page-head">
        <Badge>{m.tracks.intersections.badge}</Badge>
        <h1>{INTERSECTIONS.title}</h1>
        <p>{INTERSECTIONS.description}</p>
        <div className="ap-page-head-meta">
          <span>
            {percent}% {m.tracks.studied}
          </span>
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

      {groups.map((group) => {
        const types = getIntersectionTypesByGroup(group.slug)
        const sectionStart = runningIndex
        runningIndex += types.length

        return (
          <section key={group.slug} className="ap-track-section">
            <h2>{group.title}</h2>
            <p className="ap-track-section-desc">{group.description}</p>
            <IntersectionTypeList
              types={types}
              unlocked={unlocked}
              hydrated={hydrated}
              studiedSlugs={studiedSlugs}
              startIndex={sectionStart}
            />
          </section>
        )
      })}

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

type IntersectionStepFooterProps = {
  typeSlug: string
}

function IntersectionStepFooter({ typeSlug }: IntersectionStepFooterProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const next = getNextIntersectionStep(typeSlug)

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
        <Link href={getIntersectionsQuizHref()}>{m.chapter.goToQuiz}</Link>
      </Button>
    </div>
  )
}

type IntersectionTypeViewProps = {
  typeSlug: string
}

export function IntersectionTypeView({ typeSlug }: IntersectionTypeViewProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, studyIntersection, unstudyIntersection } =
    useApprentissageProgress()
  const type = getIntersectionType(typeSlug)

  if (!type) return null

  const studied = hydrated
    ? progress.intersections.typesStudied.includes(type.slug)
    : false
  const hasSign = Boolean(type.sign?.image)
  const hasScenario = Boolean(type.scenario?.image)

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

      {hasSign || hasScenario ? (
        <section className="ap-intersection-visuals">
          {hasSign ? (
            <figure className="ap-intersection-sign">
              <figcaption>{m.tracks.prioritySignTitle}</figcaption>
              <div className="ap-intersection-sign-frame">
                <IntersectionMediaImage
                  src={type.sign!.image}
                  alt={type.sign!.name}
                />
              </div>
              <p className="ap-intersection-sign-name">{type.sign!.name}</p>
            </figure>
          ) : null}
          {hasScenario ? (
            <figure className="ap-intersection-scenario">
              <figcaption>{m.tracks.scenarioTitle}</figcaption>
              <div className="ap-intersection-scenario-frame">
                <IntersectionMediaImage
                  src={type.scenario!.image}
                  alt={type.scenario!.caption}
                  variant="scenario"
                />
              </div>
              <p className="ap-intersection-scenario-caption">
                {type.scenario!.caption}
              </p>
              {type.scenario!.passingOrder &&
              type.scenario!.passingOrder.length > 0 ? (
                <IntersectionPassingOrder
                  passingOrder={type.scenario!.passingOrder}
                  m={m}
                />
              ) : null}
            </figure>
          ) : null}
        </section>
      ) : null}

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

      <div className="ap-intersection-actions">
        {studied ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="ap-sign-card-btn ap-sign-card-btn--unread"
            onClick={() => unstudyIntersection(type.slug)}
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
            onClick={() => studyIntersection(type.slug)}
          >
            <BookOpenCheck className="size-4" aria-hidden />
            {m.chapter.markComplete}
          </Button>
        )}
      </div>

      <IntersectionStepFooter typeSlug={type.slug} />
    </div>
  )
}
