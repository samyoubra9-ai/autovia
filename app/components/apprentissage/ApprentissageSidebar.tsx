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
import {
  getGlobalCompletionPercent,
  getPanneauxCategoryPercent,
  isIntersectionsUnlocked,
  QUIZ_PASS_THRESHOLD_PERCENT,
  TRACKS_TOTAL,
  tracksCompletedCount,
} from "@/lib/apprentissage/access"
import { PANNEAUX, INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
import {
  getIntersectionTypeHref,
  getIntersectionsQuizHref,
  getPanneauCategoryHref,
  getPanneauxQuizHref,
  getTrackHref,
} from "@/lib/apprentissage/tracks/routes"
import type { TrackSlug } from "@/lib/apprentissage/tracks/types"
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

  const tracksDone = useMemo(
    () => (hydrated ? tracksCompletedCount(progress) : 0),
    [hydrated, progress],
  )

  const [expanded, setExpanded] = useState<TrackSlug | null>(() => {
    if (pathname.startsWith("/apprendre/panneaux")) return "panneaux"
    if (pathname.startsWith("/apprendre/intersections")) return "intersections"
    return "panneaux"
  })

  useEffect(() => {
    if (pathname.startsWith("/apprendre/panneaux")) setExpanded("panneaux")
    else if (pathname.startsWith("/apprendre/intersections"))
      setExpanded("intersections")
  }, [pathname])

  const intersectionsLocked = hydrated
    ? !isIntersectionsUnlocked(progress)
    : false

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
              done: tracksDone,
              total: TRACKS_TOTAL,
            })}
          </p>
        </div>
      </div>

      <nav className="ap-sidebar-nav" aria-label={m.shell.sidebarTitle}>
        <ul className="ap-nav-list">
          {/* Panneaux */}
          <li
            className={cn(
              "ap-nav-module",
              pathname.startsWith("/apprendre/panneaux") && "ap-nav-module--active",
            )}
          >
            <div className="ap-nav-module-head">
              <Link
                href={getTrackHref("panneaux")}
                className="ap-nav-module-link"
                onClick={onNavigate}
              >
                <span
                  className={cn(
                    "ap-nav-step",
                    hydrated &&
                      progress.panneaux.quizPassed &&
                      "ap-nav-step--done",
                    pathname.startsWith("/apprendre/panneaux") &&
                      "ap-nav-step--active",
                  )}
                >
                  {hydrated && progress.panneaux.quizPassed ? (
                    <Check className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    "01"
                  )}
                </span>
                <span className="ap-nav-module-text">
                  <span className="ap-nav-module-title">{PANNEAUX.title}</span>
                  <span className="ap-nav-module-sub">
                    {m.tracks.panneaux.badge}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                className={cn(
                  "ap-nav-module-toggle",
                  expanded === "panneaux" && "ap-nav-module-toggle--open",
                )}
                aria-expanded={expanded === "panneaux"}
                aria-label={expanded === "panneaux" ? m.shell.closeMenu : m.shell.openMenu}
                onClick={() =>
                  setExpanded((cur) => (cur === "panneaux" ? null : "panneaux"))
                }
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {expanded === "panneaux" ? (
              <ul className="ap-nav-chapters">
                {PANNEAUX.categories.map((cat) => {
                  const href = getPanneauCategoryHref(cat.slug)
                  const percent = hydrated
                    ? getPanneauxCategoryPercent(cat.slug, progress)
                    : 0
                  const done = hydrated
                    ? progress.panneaux.categoriesCompleted.includes(cat.slug)
                    : false
                  const active = pathname === href

                  return (
                    <li key={cat.slug}>
                      <Link
                        href={href}
                        className={cn(
                          "ap-nav-chapter",
                          active && "ap-nav-chapter--active",
                          done && "ap-nav-chapter--done",
                        )}
                        onClick={onNavigate}
                      >
                        <span className="ap-nav-chapter-label">{cat.title}</span>
                        <span className="ap-nav-module-pct">{percent}%</span>
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
                    href={getPanneauxQuizHref()}
                    className={cn(
                      "ap-nav-chapter ap-nav-chapter--quiz",
                      pathname === getPanneauxQuizHref() &&
                        "ap-nav-chapter--active",
                      hydrated &&
                        progress.panneaux.quizPassed &&
                        "ap-nav-chapter--done",
                    )}
                    onClick={onNavigate}
                  >
                    <span className="ap-nav-chapter-label">{m.shell.quizLabel}</span>
                    {hydrated && progress.panneaux.quizPassed ? (
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

          {/* Intersections */}
          <li
            className={cn(
              "ap-nav-module",
              intersectionsLocked && "ap-nav-module--locked",
              pathname.startsWith("/apprendre/intersections") &&
                "ap-nav-module--active",
            )}
          >
            {intersectionsLocked ? (
              <div className="ap-nav-module-head ap-nav-module-head--locked">
                <div className="ap-nav-module-link ap-nav-module-link--disabled">
                  <span className="ap-nav-step ap-nav-step--locked">
                    <Lock className="size-3" />
                  </span>
                  <span className="ap-nav-module-text">
                    <span className="ap-nav-module-title">
                      {INTERSECTIONS.title}
                    </span>
                    <span className="ap-nav-module-sub">
                      {formatApprentissageMessage(m.dashboard.lockedModule, {
                        score: QUIZ_PASS_THRESHOLD_PERCENT,
                      })}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="ap-nav-module-head">
                  <Link
                    href={getTrackHref("intersections")}
                    className="ap-nav-module-link"
                    onClick={onNavigate}
                  >
                    <span
                      className={cn(
                        "ap-nav-step",
                        hydrated &&
                          progress.intersections.quizPassed &&
                          "ap-nav-step--done",
                        pathname.startsWith("/apprendre/intersections") &&
                          "ap-nav-step--active",
                      )}
                    >
                      {hydrated && progress.intersections.quizPassed ? (
                        <Check className="size-3.5" strokeWidth={2.5} />
                      ) : (
                        "02"
                      )}
                    </span>
                    <span className="ap-nav-module-text">
                      <span className="ap-nav-module-title">
                        {INTERSECTIONS.title}
                      </span>
                      <span className="ap-nav-module-sub">
                        {m.tracks.intersections.badge}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className={cn(
                      "ap-nav-module-toggle",
                      expanded === "intersections" && "ap-nav-module-toggle--open",
                    )}
                    aria-expanded={expanded === "intersections"}
                    aria-label={
                      expanded === "intersections"
                        ? m.shell.closeMenu
                        : m.shell.openMenu
                    }
                    onClick={() =>
                      setExpanded((cur) =>
                        cur === "intersections" ? null : "intersections",
                      )
                    }
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {expanded === "intersections" ? (
                  <ul className="ap-nav-chapters">
                    {INTERSECTIONS.types.map((type) => {
                      const href = getIntersectionTypeHref(type.slug)
                      const studied = hydrated
                        ? progress.intersections.typesStudied.includes(type.slug)
                        : false
                      const active = pathname === href

                      return (
                        <li key={type.slug}>
                          <Link
                            href={href}
                            className={cn(
                              "ap-nav-chapter",
                              active && "ap-nav-chapter--active",
                              studied && "ap-nav-chapter--done",
                            )}
                            onClick={onNavigate}
                          >
                            <span className="ap-nav-chapter-label">
                              {type.title}
                            </span>
                            {studied ? (
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
                        href={getIntersectionsQuizHref()}
                        className={cn(
                          "ap-nav-chapter ap-nav-chapter--quiz",
                          pathname === getIntersectionsQuizHref() &&
                            "ap-nav-chapter--active",
                          hydrated &&
                            progress.intersections.quizPassed &&
                            "ap-nav-chapter--done",
                        )}
                        onClick={onNavigate}
                      >
                        <span className="ap-nav-chapter-label">
                          {m.shell.quizLabel}
                        </span>
                        {hydrated && progress.intersections.quizPassed ? (
                          <Check
                            className="size-3.5 shrink-0 text-emerald-600"
                            strokeWidth={2.5}
                          />
                        ) : null}
                      </Link>
                    </li>
                  </ul>
                ) : null}
              </>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  )
}
