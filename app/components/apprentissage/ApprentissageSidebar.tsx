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
  getPanneauxFamilyPercent,
  getPanneauxSectionPercent,
  isIntersectionsUnlocked,
  QUIZ_PASS_THRESHOLD_PERCENT,
  TRACKS_TOTAL,
  tracksCompletedCount,
} from "@/lib/apprentissage/access"
import {
  getInitiationLabel,
  INITIATION,
} from "@/lib/apprentissage/initiation"
import { getInitiationHref } from "@/lib/apprentissage/initiation-routes"
import {
  categoryHasSections,
  familyHasFlatSigns,
  getIntersectionGroups,
  PANNEAUX,
  INTERSECTIONS,
} from "@/lib/apprentissage/tracks/content"
import { getIntersectionTypesByGroup } from "@/lib/apprentissage/tracks/intersections-navigation"
import {
  getIntersectionTypeHref,
  getIntersectionsQuizHref,
  getPanneauCategoryHref,
  getPanneauFamilyHref,
  getPanneauSectionHref,
  getPanneauxQuizHref,
  getTrackHref,
} from "@/lib/apprentissage/tracks/routes"
import type { TrackSlug } from "@/lib/apprentissage/tracks/types"
import { sectionProgressKey } from "@/lib/apprentissage/tracks/types"
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

  const [expandedPanneauCategories, setExpandedPanneauCategories] = useState<
    Set<string>
  >(() => new Set())

  const [expandedPanneauFamilies, setExpandedPanneauFamilies] = useState<
    Set<string>
  >(() => new Set())

  const panneauCategoryKey = (familySlug: string, categorySlug: string) =>
    `${familySlug}:${categorySlug}`

  useEffect(() => {
    if (pathname.startsWith("/apprendre/panneaux")) setExpanded("panneaux")
    else if (pathname.startsWith("/apprendre/intersections"))
      setExpanded("intersections")
  }, [pathname])

  useEffect(() => {
    for (const family of PANNEAUX.families) {
      const familyBase = getPanneauFamilyHref(family.slug)
      if (
        pathname === familyBase ||
        pathname.startsWith(`${familyBase}/`)
      ) {
        setExpandedPanneauFamilies((current) => {
          if (current.has(family.slug)) return current
          const next = new Set(current)
          next.add(family.slug)
          return next
        })
      }

      for (const cat of family.categories ?? []) {
        if (!categoryHasSections(cat)) continue
        const base = getPanneauCategoryHref(family.slug, cat.slug)
        if (pathname === base || pathname.startsWith(`${base}/`)) {
          setExpandedPanneauCategories((current) => {
            const key = panneauCategoryKey(family.slug, cat.slug)
            if (current.has(key)) return current
            const next = new Set(current)
            next.add(key)
            return next
          })
        }
      }
    }
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
          {/* Initiation */}
          <li
            className={cn(
              "ap-nav-module",
              pathname.startsWith("/apprendre/initiation") &&
                "ap-nav-module--active",
            )}
          >
            <div className="ap-nav-module-head">
              <Link
                href={getInitiationHref()}
                className="ap-nav-module-link"
                onClick={onNavigate}
              >
                <span
                  className={cn(
                    "ap-nav-step",
                    pathname.startsWith("/apprendre/initiation") &&
                      "ap-nav-step--active",
                  )}
                >
                  ★
                </span>
                <span className="ap-nav-module-text">
                  <span className="ap-nav-module-title">
                    {getInitiationLabel(INITIATION.title, locale)}
                  </span>
                  <span className="ap-nav-module-sub">{m.initiation.badge}</span>
                </span>
              </Link>
            </div>
          </li>

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
                {PANNEAUX.families.map((family) => {
                  const familyHref = getPanneauFamilyHref(family.slug)
                  const flatSigns = familyHasFlatSigns(family)
                  const familyOpen = expandedPanneauFamilies.has(family.slug)
                  const familyActive =
                    pathname === familyHref ||
                    pathname.startsWith(`${familyHref}/`)
                  const familyPercent = hydrated
                    ? getPanneauxFamilyPercent(family.slug, progress)
                    : 0

                  return (
                  <li key={family.slug} className="ap-nav-family-group">
                    <div className="ap-nav-family-head">
                      <Link
                        href={familyHref}
                        className={cn(
                          "ap-nav-family-label ap-nav-family-label--link",
                          familyActive && "ap-nav-family-label--active",
                          flatSigns && "ap-nav-family-label--bold",
                        )}
                        onClick={onNavigate}
                      >
                        {family.title}
                      </Link>
                      {!flatSigns ? (
                      <button
                        type="button"
                        className={cn(
                          "ap-nav-family-toggle",
                          familyOpen && "ap-nav-family-toggle--open",
                        )}
                        aria-expanded={familyOpen}
                        aria-label={
                          familyOpen ? m.shell.closeMenu : m.shell.openMenu
                        }
                        onClick={() =>
                          setExpandedPanneauFamilies((current) => {
                            const next = new Set(current)
                            if (next.has(family.slug)) {
                              next.delete(family.slug)
                            } else {
                              next.add(family.slug)
                            }
                            return next
                          })
                        }
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      ) : (
                        <span className="ap-nav-module-pct">{familyPercent}%</span>
                      )}
                    </div>
                    {!flatSigns && familyOpen ? (
                    <ul className="ap-nav-family-items">
                      {(family.categories ?? []).map((cat) => {
                        const href = getPanneauCategoryHref(family.slug, cat.slug)
                        const percent = hydrated
                          ? getPanneauxCategoryPercent(cat.slug, progress)
                          : 0
                        const hasSections = categoryHasSections(cat)
                        const done = hydrated
                          ? hasSections
                            ? (cat.sections?.every((section) =>
                                progress.panneaux.categoriesCompleted.includes(
                                  sectionProgressKey(cat.slug, section.slug),
                                ),
                              ) ?? false)
                            : progress.panneaux.categoriesCompleted.includes(
                                cat.slug,
                              )
                          : false
                        const active =
                          pathname === href ||
                          (hasSections &&
                            pathname.startsWith(`${href}/`))

                        if (hasSections) {
                          const categoryKey = panneauCategoryKey(
                            family.slug,
                            cat.slug,
                          )
                          const sectionsOpen =
                            expandedPanneauCategories.has(categoryKey)

                          return (
                            <li key={cat.slug} className="ap-nav-category-group">
                              <div className="ap-nav-category-head">
                                <Link
                                  href={href}
                                  className={cn(
                                    "ap-nav-chapter ap-nav-chapter--parent",
                                    active && "ap-nav-chapter--active",
                                    done && "ap-nav-chapter--done",
                                  )}
                                  onClick={onNavigate}
                                >
                                  <span className="ap-nav-chapter-label">
                                    {cat.title}
                                  </span>
                                  <span className="ap-nav-module-pct">
                                    {percent}%
                                  </span>
                                  {done ? (
                                    <Check
                                      className="size-3.5 shrink-0 text-emerald-600"
                                      strokeWidth={2.5}
                                    />
                                  ) : null}
                                </Link>
                                <button
                                  type="button"
                                  className={cn(
                                    "ap-nav-category-toggle",
                                    sectionsOpen &&
                                      "ap-nav-category-toggle--open",
                                  )}
                                  aria-expanded={sectionsOpen}
                                  aria-label={
                                    sectionsOpen
                                      ? m.shell.closeMenu
                                      : m.shell.openMenu
                                  }
                                  onClick={() =>
                                    setExpandedPanneauCategories((current) => {
                                      const next = new Set(current)
                                      if (next.has(categoryKey)) {
                                        next.delete(categoryKey)
                                      } else {
                                        next.add(categoryKey)
                                      }
                                      return next
                                    })
                                  }
                                >
                                  <ChevronRight className="size-4" />
                                </button>
                              </div>
                              {sectionsOpen ? (
                                <ul className="ap-nav-section-items">
                                  {cat.sections!.map((section) => {
                                  const sectionHref = getPanneauSectionHref(
                                    family.slug,
                                    cat.slug,
                                    section.slug,
                                  )
                                  const sectionPercent = hydrated
                                    ? getPanneauxSectionPercent(
                                        cat.slug,
                                        section.slug,
                                        progress,
                                      )
                                    : 0
                                  const sectionDone = hydrated
                                    ? progress.panneaux.categoriesCompleted.includes(
                                        sectionProgressKey(
                                          cat.slug,
                                          section.slug,
                                        ),
                                      )
                                    : false

                                  return (
                                    <li key={section.slug}>
                                      <Link
                                        href={sectionHref}
                                        className={cn(
                                          "ap-nav-chapter",
                                          pathname === sectionHref &&
                                            "ap-nav-chapter--active",
                                          sectionDone && "ap-nav-chapter--done",
                                        )}
                                        onClick={onNavigate}
                                      >
                                        <span className="ap-nav-chapter-label">
                                          {section.title}
                                        </span>
                                        <span className="ap-nav-module-pct">
                                          {sectionPercent}%
                                        </span>
                                        {sectionDone ? (
                                          <Check
                                            className="size-3.5 shrink-0 text-emerald-600"
                                            strokeWidth={2.5}
                                          />
                                        ) : null}
                                      </Link>
                                    </li>
                                  )
                                })}
                                </ul>
                              ) : null}
                            </li>
                          )
                        }

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
                              <span className="ap-nav-chapter-label">
                                {cat.title}
                              </span>
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
                    </ul>
                    ) : null}
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
                    {getIntersectionGroups().map((group) => (
                      <li key={group.slug} className="ap-nav-section">
                        <div className="ap-nav-section-label">{group.title}</div>
                        <ul className="ap-nav-section-lessons">
                          {getIntersectionTypesByGroup(group.slug).map((type) => {
                            const href = getIntersectionTypeHref(type.slug)
                            const studied = hydrated
                              ? progress.intersections.typesStudied.includes(
                                  type.slug,
                                )
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
                        </ul>
                      </li>
                    ))}
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
