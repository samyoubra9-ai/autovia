"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, Menu, Smartphone, X } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { LocaleSwitcher } from "@/app/components/vitrine/LocaleSwitcher"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getGlobalCompletionPercent } from "@/lib/apprentissage/access"
import {
  getPanneauCategory,
  getIntersectionType,
  isPanneauCategory,
  isIntersectionType,
  isTrackSlug,
  PANNEAUX,
  INTERSECTIONS,
} from "@/lib/apprentissage/tracks/content"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { cn } from "@/lib/utils"

import { useCookieConsent } from "@/app/components/vitrine/CookieConsentProvider"

import { ApprentissageProgressProvider, useApprentissageProgress } from "./ApprentissageProgressProvider"
import { ApprentissageSidebar } from "./ApprentissageSidebar"

function ApprentissageLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { progress, hydrated, learningEnabled } = useApprentissageProgress()
  const { reopenBanner } = useCookieConsent()
  const [mobileOpen, setMobileOpen] = useState(false)

  const globalPercent = hydrated ? getGlobalCompletionPercent(progress) : 0

  const breadcrumb = useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [
      { label: m.shell.brandSubtitle, href: "/apprendre" },
    ]

    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] !== "apprendre") return crumbs

    const track = parts[1]
    if (track === "panneaux") {
      crumbs.push({ label: PANNEAUX.title, href: "/apprendre/panneaux" })
      if (parts[2] === "quiz") {
        crumbs.push({ label: m.shell.quizLabel })
      } else if (parts[2] && isPanneauCategory(parts[2])) {
        crumbs.push({ label: getPanneauCategory(parts[2])!.title })
      }
    } else if (track === "intersections") {
      crumbs.push({
        label: INTERSECTIONS.title,
        href: "/apprendre/intersections",
      })
      if (parts[2] === "quiz") {
        crumbs.push({ label: m.shell.quizLabel })
      } else if (parts[2] && isIntersectionType(parts[2])) {
        crumbs.push({ label: getIntersectionType(parts[2])!.title })
      }
    } else if (track && isTrackSlug(track)) {
      crumbs.push({
        label: track === "panneaux" ? PANNEAUX.title : INTERSECTIONS.title,
      })
    }

    return crumbs
  }, [pathname, m])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="app-ui ap-shell min-h-svh">
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

      {learningEnabled ? (
        <div className="ap-storage-hint">
          <Smartphone className="size-3.5 shrink-0" aria-hidden />
          <span>{m.shell.storageHint}</span>
        </div>
      ) : (
        <div className="ap-storage-hint ap-storage-hint--disabled">
          <Smartphone className="size-3.5 shrink-0" aria-hidden />
          <span>{m.shell.storageDisabled}</span>
          <button
            type="button"
            className="ap-storage-hint__btn"
            onClick={reopenBanner}
          >
            {m.shell.enableStorage}
          </button>
        </div>
      )}
    </div>
  )
}

export function ApprentissageShell({ children }: { children: ReactNode }) {
  return (
    <ApprentissageProgressProvider>
      <ApprentissageLayoutInner>{children}</ApprentissageLayoutInner>
    </ApprentissageProgressProvider>
  )
}
