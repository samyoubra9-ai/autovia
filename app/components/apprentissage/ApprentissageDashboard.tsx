"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
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
  getModuleAccessState,
  getModuleCompletionPercent,
  isModuleUnlocked,
  QUIZ_PASS_THRESHOLD_PERCENT,
} from "@/lib/apprentissage/access"
import {
  APPRENTISSAGE_CURRICULUM,
  getModuleHref,
} from "@/lib/apprentissage/curriculum"
import { cn } from "@/lib/utils"

import { MODULE_UI } from "./module-ui"
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

export function ApprentissageDashboard() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const globalPercent = hydrated ? getGlobalCompletionPercent(progress) : 0

  const modulesCompleted = hydrated
    ? APPRENTISSAGE_CURRICULUM.filter(
        (mod) => progress.modules[mod.slug].quizPassed,
      ).length
    : 0

  const nextModule = APPRENTISSAGE_CURRICULUM.find((mod) => {
    if (!hydrated) return mod.slug === "fondamentaux"
    return (
      isModuleUnlocked(mod.slug, progress) &&
      !progress.modules[mod.slug].quizPassed
    )
  })

  const nextHref = nextModule ? getModuleHref(nextModule.slug) : "/apprendre"
  const nextLabel = nextModule
    ? m.modules[nextModule.slug].title
    : m.dashboard.allComplete

  const heroCta =
    modulesCompleted === APPRENTISSAGE_CURRICULUM.length
      ? m.dashboard.reviewModule
      : nextModule && hydrated
        ? getModuleAccessState(nextModule.slug, progress) === "in_progress"
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
                {modulesCompleted}/{APPRENTISSAGE_CURRICULUM.length}
              </span>
              <span className="ap-dash-metric-label">
                {m.dashboard.statsModules}
              </span>
            </div>
          </div>

          {nextModule ? (
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
              done: modulesCompleted,
              total: APPRENTISSAGE_CURRICULUM.length,
            })}
          </span>
        </header>

        <ol className="ap-dash-steps">
          {APPRENTISSAGE_CURRICULUM.map((mod, index) => {
            const moduleMessages = m.modules[mod.slug]
            const ui = MODULE_UI[mod.slug]
            const Icon = ui.icon
            const state = hydrated
              ? getModuleAccessState(mod.slug, progress)
              : mod.slug === "fondamentaux"
                ? "available"
                : "locked"
            const percent = hydrated
              ? getModuleCompletionPercent(mod.slug, progress)
              : 0
            const locked = state === "locked"
            const completed = state === "completed"
            const inProgress = state === "in_progress"
            const isLast = index === APPRENTISSAGE_CURRICULUM.length - 1
            const stepLabel = String(mod.step).padStart(2, "0")

            const ctaLabel = locked
              ? m.shell.locked
              : completed
                ? m.dashboard.reviewModule
                : inProgress
                  ? m.dashboard.continueModule
                  : m.dashboard.startModule

            const chaptersDone = hydrated
              ? progress.modules[mod.slug].chaptersCompleted.length
              : 0

            return (
              <li
                key={mod.slug}
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
                        {formatApprentissageMessage(m.module.stepLabel, {
                          step: mod.step,
                        })}
                        {" · "}
                        {moduleMessages.subtitle}
                      </span>
                      <h3>{moduleMessages.title}</h3>
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

                  <p className="ap-dash-step-desc">{moduleMessages.description}</p>

                  <div className="ap-dash-step-meta">
                    <span className="ap-dash-step-meta-item">
                      <BookOpen className="size-3.5" aria-hidden />
                      {formatApprentissageMessage(m.dashboard.chaptersCount, {
                        count: mod.chapterSlugs.length,
                      })}
                    </span>
                    {!locked ? (
                      <span className="ap-dash-step-meta-item">
                        <ClipboardList className="size-3.5" aria-hidden />
                        {formatApprentissageMessage(m.dashboard.chaptersRead, {
                          done: chaptersDone,
                          total: mod.chapterSlugs.length,
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
                    <Link
                      href={getModuleHref(mod.slug)}
                      className="ap-dash-step-cta"
                    >
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
