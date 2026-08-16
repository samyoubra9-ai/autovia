"use client"

import Link from "next/link"
import {
  ArrowRight,
  Check,
  ClipboardList,
  Compass,
  Lock,
  Play,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import {
  getGlobalCompletionPercent,
  getIntersectionsProgressPercent,
  getPanneauxProgressPercent,
  isIntersectionsUnlocked,
  QUIZ_PASS_THRESHOLD_PERCENT,
  TRACKS_TOTAL,
  tracksCompletedCount,
} from "@/lib/apprentissage/access"
import { getInitiationLabel, INITIATION } from "@/lib/apprentissage/initiation"
import { getInitiationHref } from "@/lib/apprentissage/initiation-routes"
import { PANNEAUX, INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import {
  getIntersectionsHref,
  getPanneauxHref,
} from "@/lib/apprentissage/tracks/routes"
import type {
  ApprentissageProgress,
  TrackSlug,
} from "@/lib/apprentissage/tracks/types"
import { cn } from "@/lib/utils"

import { TRACK_UI } from "./track-ui"
import { useApprentissageProgress } from "./ApprentissageProgressProvider"

function DashboardProgressRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className="ap-dash-ring"
      style={{ "--ap-dash-ring": `${clamped}%` } as React.CSSProperties}
      aria-hidden
    >
      <div className="ap-dash-ring-inner">
        <span className="ap-dash-ring-value">{clamped}%</span>
        <span className="ap-dash-ring-label">total</span>
      </div>
    </div>
  )
}

const TRACKS: Array<{
  slug: TrackSlug
  title: string
  description: string
  href: string
  itemsLabel: string
  itemCount: number
}> = [
  {
    slug: "panneaux",
    title: PANNEAUX.title,
    description: PANNEAUX.description,
    href: getPanneauxHref(),
    itemsLabel: "categories",
    itemCount: PANNEAUX.families.length,
  },
  {
    slug: "intersections",
    title: INTERSECTIONS.title,
    description: INTERSECTIONS.description,
    href: getIntersectionsHref(),
    itemsLabel: "types",
    itemCount: INTERSECTIONS.types.length,
  },
]

export function ApprentissageDashboard() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const globalPercent = hydrated ? getGlobalCompletionPercent(progress) : 0
  const tracksDone = hydrated ? tracksCompletedCount(progress) : 0

  const nextTrack = TRACKS.find((track) => {
    if (!hydrated) return track.slug === "panneaux"
    if (track.slug === "panneaux") {
      return !progress.panneaux.quizPassed
    }
    if (!isIntersectionsUnlocked(progress)) return false
    return !progress.intersections.quizPassed
  })

  const nextHref = nextTrack?.href ?? "/apprendre"
  const nextLabel = nextTrack
    ? tTrack(nextTrack.title, locale)
    : m.dashboard.allComplete

  const heroCta =
    tracksDone === TRACKS_TOTAL
      ? m.dashboard.reviewModule
      : nextTrack && hydrated
        ? trackInProgress(nextTrack.slug, progress)
          ? m.dashboard.continueModule
          : m.dashboard.startModule
        : m.dashboard.startModule

  return (
    <div className="ap-dash">
      <section className="ap-dash-hero">
        <div className="ap-dash-hero-main">
          <p className="ap-dash-eyebrow">{m.shell.platformLabel}</p>
          <h1>{m.dashboard.title}</h1>
          <p className="ap-dash-lead">{m.dashboard.subtitle}</p>

          <div className="ap-dash-hero-metrics">
            <div className="ap-dash-metric">
              <span className="ap-dash-metric-value">{globalPercent}%</span>
              <span className="ap-dash-metric-label">
                {m.dashboard.statsProgress}
              </span>
            </div>
            <div className="ap-dash-metric-divider" aria-hidden />
            <div className="ap-dash-metric">
              <span className="ap-dash-metric-value">
                {tracksDone}/{TRACKS_TOTAL}
              </span>
              <span className="ap-dash-metric-label">
                {m.dashboard.statsModules}
              </span>
            </div>
          </div>

          {nextTrack ? (
            <Button asChild size="lg" className="ap-dash-hero-cta">
              <Link href={nextHref}>
                <Play className="size-4" aria-hidden />
                {heroCta}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <div className="ap-dash-complete-badge">
              <Check className="size-4" aria-hidden />
              {m.dashboard.allComplete}
            </div>
          )}
        </div>

        <div className="ap-dash-hero-aside">
          <DashboardProgressRing percent={globalPercent} />
          <div className="ap-dash-next-card">
            <span className="ap-dash-next-label">{m.dashboard.statsNext}</span>
            <p className="ap-dash-next-title">{nextLabel}</p>
            <div className="ap-progress-track ap-progress-track--lg">
              <div
                className="ap-progress-fill"
                style={{ width: `${globalPercent}%` }}
              />
            </div>
            <span className="ap-dash-next-hint">{m.dashboard.globalProgress}</span>
          </div>
        </div>
      </section>

      <section className="ap-dash-roadmap">
        <header className="ap-dash-roadmap-head">
          <div>
            <h2>{m.dashboard.roadmapTitle}</h2>
            <p>{m.dashboard.roadmapSubtitle}</p>
          </div>
          <span className="ap-dash-roadmap-count">
            {formatApprentissageMessage(m.shell.modulesCompleted, {
              done: tracksDone,
              total: TRACKS_TOTAL,
            })}
          </span>
        </header>

        <ol className="ap-dash-steps">
          <li
            className="ap-dash-step ap-dash-step--initiation ap-dash-step--line"
            style={
              {
                "--ap-mod-accent": "#059669",
                "--ap-mod-soft": "#ecfdf5",
              } as React.CSSProperties
            }
          >
            <div className="ap-dash-step-track" aria-hidden>
              <span className="ap-dash-step-node ap-dash-step-node--active">
                <Compass className="size-4" />
              </span>
            </div>
            <div className="ap-dash-step-card">
              <div className="ap-dash-step-card-head">
                <div className="ap-dash-step-icon">
                  <Compass className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="ap-dash-step-kicker">{m.initiation.badge}</p>
                  <h3>{m.initiation.dashboardTitle}</h3>
                </div>
                <Button asChild size="sm" variant="outline" className="ml-auto">
                  <Link href={getInitiationHref()}>
                    {m.dashboard.startModule}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
              <p className="ap-dash-step-desc">
                {m.initiation.dashboardDescription}
              </p>
              <p className="ap-dash-step-desc ap-dash-step-desc--muted">
                {getInitiationLabel(INITIATION.title, locale)}
              </p>
            </div>
          </li>

          {TRACKS.map((track, index) => {
            const ui = TRACK_UI[track.slug]
            const Icon = ui.icon
            const locked =
              hydrated &&
              track.slug === "intersections" &&
              !isIntersectionsUnlocked(progress)
            const completed = hydrated
              ? track.slug === "panneaux"
                ? progress.panneaux.quizPassed
                : progress.intersections.quizPassed
              : false
            const percent = hydrated
              ? track.slug === "panneaux"
                ? getPanneauxProgressPercent(progress)
                : getIntersectionsProgressPercent(progress)
              : 0
            const inProgress = !locked && !completed && percent > 0
            const isLast = index === TRACKS.length - 1
            const stepLabel = String(index + 1).padStart(2, "0")

            const ctaLabel = locked
              ? m.shell.locked
              : completed
                ? m.dashboard.reviewModule
                : inProgress
                  ? m.dashboard.continueModule
                  : m.dashboard.startModule

            const studiedCount =
              track.slug === "panneaux"
                ? hydrated
                  ? progress.panneaux.signsStudied.length
                  : 0
                : hydrated
                  ? progress.intersections.typesStudied.length
                  : 0

            return (
              <li
                key={track.slug}
                className={cn(
                  "ap-dash-step",
                  locked && "ap-dash-step--locked",
                  completed && "ap-dash-step--done",
                  inProgress && "ap-dash-step--active",
                  !isLast && "ap-dash-step--line",
                )}
                style={
                  {
                    "--ap-mod-accent": ui.accent,
                    "--ap-mod-soft": ui.soft,
                  } as React.CSSProperties
                }
              >
                <div className="ap-dash-step-track" aria-hidden>
                  <span
                    className={cn(
                      "ap-dash-step-node",
                      completed && "ap-dash-step-node--done",
                      inProgress && "ap-dash-step-node--active",
                      locked && "ap-dash-step-node--locked",
                    )}
                  >
                    {completed ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : locked ? (
                      <Lock className="size-3.5" />
                    ) : (
                      stepLabel
                    )}
                  </span>
                </div>

                <article className="ap-dash-step-card">
                  <div className="ap-dash-step-card-head">
                    <div className="ap-dash-step-icon">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <div className="ap-dash-step-titles">
                      <span className="ap-dash-step-eyebrow">
                        {formatApprentissageMessage(m.tracks.stepLabel, {
                          step: index + 1,
                        })}
                      </span>
                      <h3>{tTrack(track.title, locale)}</h3>
                    </div>
                    <span
                      className={cn(
                        "ap-dash-step-status",
                        completed && "ap-dash-step-status--done",
                        inProgress && "ap-dash-step-status--active",
                        locked && "ap-dash-step-status--locked",
                      )}
                    >
                      {completed
                        ? m.shell.completed
                        : locked
                          ? m.shell.locked
                          : inProgress
                            ? m.shell.inProgress
                            : m.dashboard.startModule}
                    </span>
                  </div>

                  <p className="ap-dash-step-desc">{tTrack(track.description, locale)}</p>

                  <div className="ap-dash-step-meta">
                    <span className="ap-dash-step-meta-item">
                      <ClipboardList className="size-3.5" aria-hidden />
                      {track.slug === "panneaux"
                        ? formatApprentissageMessage(m.tracks.familiesCount, {
                            count: track.itemCount,
                          })
                        : formatApprentissageMessage(m.tracks.typesCount, {
                            count: track.itemCount,
                          })}
                    </span>
                    {!locked ? (
                      <span className="ap-dash-step-meta-item">
                        {track.slug === "panneaux"
                          ? formatApprentissageMessage(m.tracks.signsStudied, {
                              done: studiedCount,
                            })
                          : formatApprentissageMessage(m.tracks.typesStudied, {
                              done: studiedCount,
                              total: track.itemCount,
                            })}
                      </span>
                    ) : null}
                    <span className="ap-dash-step-meta-pct">{percent}%</span>
                  </div>

                  <div className="ap-dash-step-progress">
                    <div
                      className="ap-progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {locked ? (
                    <p className="ap-dash-step-lock">
                      <Lock className="size-3.5 shrink-0" />
                      {formatApprentissageMessage(m.dashboard.lockedModule, {
                        score: QUIZ_PASS_THRESHOLD_PERCENT,
                      })}
                    </p>
                  ) : (
                    <Link href={track.href} className="ap-dash-step-cta">
                      {ctaLabel}
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="ap-dash-modes">
        <h2 className="ap-dash-modes-title">{m.dashboard.quizInfoTitle}</h2>
        <p className="ap-dash-modes-desc">{m.dashboard.quizInfoText}</p>
      </section>
    </div>
  )
}

function trackInProgress(slug: TrackSlug, progress: ApprentissageProgress) {
  if (slug === "panneaux") {
    return (
      progress.panneaux.signsStudied.length > 0 ||
      progress.panneaux.quizBestScore !== null
    )
  }
  return (
    progress.intersections.typesStudied.length > 0 ||
    progress.intersections.quizBestScore !== null
  )
}
