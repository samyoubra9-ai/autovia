"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, Menu, Smartphone, X } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { LocaleSwitcher } from "@/app/components/vitrine/LocaleSwitcher"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getInitiationLabel, INITIATION } from "@/lib/apprentissage/initiation"
import { getGlobalCompletionPercent } from "@/lib/apprentissage/access"
import {
  categoryHasSections,
  getPanneauCategory,
  getPanneauFamily,
  getPanneauSection,
  getIntersectionType,
  isPanneauCategory,
  isPanneauFamilySlug,
  isIntersectionType,
  isTrackSlug,
  PANNEAUX,
  INTERSECTIONS,
} from "@/lib/apprentissage/tracks/content"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import {
  getPanneauCategoryHref,
  getPanneauFamilyHref,
} from "@/lib/apprentissage/tracks/routes"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { cn } from "@/lib/utils"

import { ApprentissageProgressProvider, useApprentissageProgress } from "./ApprentissageProgressProvider"
import { ApprentissageSidebar } from "./ApprentissageSidebar"
import { QuizImmersiveProvider, useQuizImmersive } from "./QuizImmersiveContext"

function ApprentissageLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated } = useApprentissageProgress()
  const { immersive: quizImmersive } = useQuizImmersive()
  const [mobileOpen, setMobileOpen] = useState(false)

  const globalPercent = hydrated ? getGlobalCompletionPercent(progress) : 0

  const breadcrumb = useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [
      { label: m.shell.brandSubtitle, href: "/apprendre" },
    ]

    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] !== "apprendre") return crumbs

    const track = parts[1]
    if (track === "initiation") {
      crumbs.push({
        label: getInitiationLabel(INITIATION.title, locale),
      })
    } else if (track === "panneaux") {
      crumbs.push({
        label: tTrack(PANNEAUX.title, locale),
        href: "/apprendre/panneaux",
      })
      if (parts[2] === "quiz") {
        crumbs.push({ label: m.shell.quizLabel })
      } else if (parts[2] && isPanneauFamilySlug(parts[2])) {
        const family = getPanneauFamily(parts[2])!
        crumbs.push({
          label: tTrack(family.title, locale),
          href: getPanneauFamilyHref(family.slug),
        })
        if (parts[3] && isPanneauCategory(parts[3])) {
          const panneauCategory = getPanneauCategory(parts[3])!
          crumbs.push({
            label: tTrack(panneauCategory.title, locale),
            href: getPanneauCategoryHref(family.slug, panneauCategory.slug),
          })
          if (parts[4] && categoryHasSections(panneauCategory)) {
            const section = getPanneauSection(parts[3], parts[4])
            if (section) {
              crumbs.push({ label: tTrack(section.title, locale) })
            }
          }
        }
      } else if (parts[2] && isPanneauCategory(parts[2])) {
        crumbs.push({
          label: tTrack(getPanneauCategory(parts[2])!.title, locale),
        })
      }
    } else if (track === "intersections") {
      crumbs.push({
        label: tTrack(INTERSECTIONS.title, locale),
        href: "/apprendre/intersections",
      })
      if (parts[2] === "quiz") {
        crumbs.push({ label: m.shell.quizLabel })
      } else if (parts[2] && isIntersectionType(parts[2])) {
        crumbs.push({
          label: tTrack(getIntersectionType(parts[2])!.title, locale),
        })
      }
    } else if (track && isTrackSlug(track)) {
      crumbs.push({
        label: tTrack(
          track === "panneaux" ? PANNEAUX.title : INTERSECTIONS.title,
          locale,
        ),
      })
    }

    return crumbs
  }, [pathname, m, locale])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (quizImmersive) setMobileOpen(false)
  }, [quizImmersive])

  return (
    <div
      className={cn(
        "app-ui ap-shell min-h-svh",
        quizImmersive && "ap-shell--quiz-immersive",
      )}
    >
      <header className="ap-topbar">
        <div className="ap-topbar-inner">
          <div className="ap-topbar-left">
            <button
              type="button"
              className="ap-mobile-menu-btn"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? m.shell.closeMenu : m.shell.openMenu}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <Link href="/apprendre" className="ap-topbar-brand">
              <Image
                src="/brand/favicon/favicon-96x96.png"
                alt=""
                width={36}
                height={36}
                className="ap-topbar-logo"
              />
              <span className="ap-topbar-brand-text">
                <span className="ap-topbar-name">
                  Auto<span>via</span>
                </span>
                <span className="ap-topbar-tag">{m.shell.platformLabel}</span>
              </span>
            </Link>
          </div>

          <nav className="ap-topbar-crumb" aria-label="Fil d'Ariane">
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="ap-crumb-item">
                {index > 0 ? (
                  <ChevronRight className="ap-crumb-sep" aria-hidden />
                ) : null}
                {crumb.href && index < breadcrumb.length - 1 ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span className="ap-crumb-current">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="ap-topbar-actions">
            <div className="ap-topbar-progress" title={m.shell.sidebarProgress}>
              <span className="ap-topbar-progress-label">{globalPercent}%</span>
              <div className="ap-progress-track ap-progress-track--sm">
                <div
                  className="ap-progress-fill"
                  style={{ width: `${globalPercent}%` }}
                />
              </div>
            </div>

            <div className="ap-topbar-divider" aria-hidden />

            <LocaleSwitcher />

            <Link href="/" className="ap-topbar-home">
              <Home className="size-4" aria-hidden />
              <span>{m.shell.backHome}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="ap-layout">
        <div
          className={cn(
            "ap-sidebar-drawer",
            mobileOpen && "ap-sidebar-drawer--open",
          )}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            className="ap-sidebar-backdrop"
            aria-label={m.shell.closeMenu}
            onClick={() => setMobileOpen(false)}
          />
          <div className="ap-sidebar-panel">
            <ApprentissageSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>

        <div className="ap-sidebar-desktop">
          <ApprentissageSidebar />
        </div>

        <main className="ap-main">
          <div className="ap-main-inner">{children}</div>
        </main>
      </div>

      <div className="ap-storage-hint">
        <Smartphone className="size-3.5 shrink-0" aria-hidden />
        <span>{m.shell.storageHint}</span>
      </div>
    </div>
  )
}

export function ApprentissageShell({ children }: { children: ReactNode }) {
  return (
    <ApprentissageProgressProvider>
      <QuizImmersiveProvider>
        <ApprentissageLayoutInner>{children}</ApprentissageLayoutInner>
      </QuizImmersiveProvider>
    </ApprentissageProgressProvider>
  )
}
