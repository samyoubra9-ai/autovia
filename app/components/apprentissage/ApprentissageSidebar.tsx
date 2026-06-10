"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, ChevronRight, Lock } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { getChapterContent } from "@/lib/i18n/apprentissage-content"
import {
  getGlobalCompletionPercent,
  getModuleAccessState,
  getModuleCompletionPercent,
  isModuleUnlocked,
  QUIZ_PASS_THRESHOLD_PERCENT,
} from "@/lib/apprentissage/access"
import {
  APPRENTISSAGE_CURRICULUM,
  getChapterHref,
  getModuleHref,
  getQuizHref,
  isModuleSlug,
} from "@/lib/apprentissage/curriculum"
import type { ModuleSlug } from "@/lib/apprentissage/types"
import { cn } from "@/lib/utils"

import { useApprentissageProgress } from "./ApprentissageProgressProvider"

export function ApprentissageSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()

  const globalPercent = useMemo(
    () => (hydrated ? getGlobalCompletionPercent(progress) : 0),
    [hydrated, progress],
  )

  const modulesCompleted = useMemo(() => {
    if (!hydrated) return 0
    return APPRENTISSAGE_CURRICULUM.filter(
      (mod) => progress.modules[mod.slug].quizPassed,
    ).length
  }, [hydrated, progress])

  const [expanded, setExpanded] = useState<ModuleSlug | null>(() => {
    const match = pathname.match(/^\/apprendre\/([^/]+)/)
    return (match?.[1] as ModuleSlug) ?? "fondamentaux"
  })

  useEffect(() => {
    const match = pathname.match(/^\/apprendre\/([^/]+)/)
    if (match?.[1] && isModuleSlug(match[1])) {
      setExpanded(match[1] as ModuleSlug)
    }
  }, [pathname])

  return (
    <aside className="ap-sidebar">
      <div className="ap-sidebar-head">
        <p className="ap-sidebar-kicker">{m.shell.menuLabel}</p>
        <p className="ap-sidebar-title">{m.shell.sidebarTitle}</p>

        <div className="ap-sidebar-progress">
          <div className="ap-sidebar-progress-row">
            <span>{m.shell.sidebarProgress}</span>
            <span className="ap-sidebar-progress-value">{globalPercent}%</span>
          </div>
          <div className="ap-progress-track">
            <div
              className="ap-progress-fill"
              style={{ width: `${globalPercent}%` }}
            />
          </div>
          <p className="ap-sidebar-progress-note">
            {formatApprentissageMessage(m.shell.modulesCompleted, {
              done: modulesCompleted,
              total: APPRENTISSAGE_CURRICULUM.length,
            })}
          </p>
        </div>
      </div>

      <nav className="ap-sidebar-nav" aria-label={m.shell.sidebarTitle}>
        <ul className="ap-nav-list">
          {APPRENTISSAGE_CURRICULUM.map((mod) => {
            const moduleMessages = m.modules[mod.slug]
            const state = hydrated
              ? getModuleAccessState(mod.slug, progress)
              : mod.slug === "fondamentaux"
                ? "available"
                : "locked"
            const unlocked = hydrated
              ? isModuleUnlocked(mod.slug, progress)
              : mod.slug === "fondamentaux"
            const percent = hydrated
              ? getModuleCompletionPercent(mod.slug, progress)
              : 0
            const isOpen = expanded === mod.slug
            const moduleActive = pathname.startsWith(getModuleHref(mod.slug))
            const stepLabel = String(mod.step).padStart(2, "0")

            return (
              <li
                key={mod.slug}
                className={cn(
                  "ap-nav-module",
                  state === "locked" && "ap-nav-module--locked",
                  moduleActive && "ap-nav-module--active",
                )}
              >
                {unlocked ? (
                  <div className="ap-nav-module-head">
                    <Link
                      href={getModuleHref(mod.slug)}
                      className="ap-nav-module-link"
                      onClick={onNavigate}
                    >
                      <span
                        className={cn(
                          "ap-nav-step",
                          state === "completed" && "ap-nav-step--done",
                          moduleActive && "ap-nav-step--active",
                        )}
                      >
                        {state === "completed" ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : (
                          stepLabel
                        )}
                      </span>
                      <span className="ap-nav-module-text">
                        <span className="ap-nav-module-title">
                          {moduleMessages.title}
                        </span>
                        <span className="ap-nav-module-sub">
                          {moduleMessages.subtitle}
                        </span>
                      </span>
                      <span className="ap-nav-module-pct">{percent}%</span>
                    </Link>
                    <button
                      type="button"
                      className={cn(
                        "ap-nav-module-toggle",
                        isOpen && "ap-nav-module-toggle--open",
                      )}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? m.shell.closeMenu : m.shell.openMenu}
                      onClick={() =>
                        setExpanded((cur) =>
                          cur === mod.slug ? null : mod.slug,
                        )
                      }
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="ap-nav-module-head ap-nav-module-head--locked">
                    <div className="ap-nav-module-link ap-nav-module-link--disabled">
                      <span className="ap-nav-step ap-nav-step--locked">
                        <Lock className="size-3" />
                      </span>
                      <span className="ap-nav-module-text">
                        <span className="ap-nav-module-title">
                          {moduleMessages.title}
                        </span>
                        <span className="ap-nav-module-sub">
                          {formatApprentissageMessage(m.dashboard.lockedModule, {
                            score: QUIZ_PASS_THRESHOLD_PERCENT,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {unlocked && isOpen ? (
                  <ul className="ap-nav-chapters">
                    {mod.chapterSlugs.map((chapterSlug) => {
                      const chapter = getChapterContent(m, mod.slug, chapterSlug)
                      const href = getChapterHref(mod.slug, chapterSlug)
                      const done =
                        progress.modules[mod.slug].chaptersCompleted.includes(
                          chapterSlug,
                        )
                      const active = pathname === href

                      return (
                        <li key={chapterSlug}>
                          <Link
                            href={href}
                            className={cn(
                              "ap-nav-chapter",
                              active && "ap-nav-chapter--active",
                              done && "ap-nav-chapter--done",
                            )}
                            onClick={onNavigate}
                          >
                            <span className="ap-nav-chapter-label">
                              {chapter.title}
                            </span>
                            {done ? (
                              <Check
                                className="size-3.5 shrink-0 text-emerald-600"
                                strokeWidth={2.5}
                              />
                            ) : null}
                          </Link>
                        </li>
                      )
                    })}
                    <li>
                      <Link
                        href={getQuizHref(mod.slug)}
                        className={cn(
                          "ap-nav-chapter ap-nav-chapter--quiz",
                          pathname === getQuizHref(mod.slug) &&
                            "ap-nav-chapter--active",
                          progress.modules[mod.slug].quizPassed &&
                            "ap-nav-chapter--done",
                        )}
                        onClick={onNavigate}
                      >
                        <span className="ap-nav-chapter-label">
                          {m.shell.quizLabel}
                        </span>
                        {progress.modules[mod.slug].quizPassed ? (
                          <Check
                            className="size-3.5 shrink-0 text-emerald-600"
                            strokeWidth={2.5}
                          />
                        ) : null}
                      </Link>
                    </li>
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
