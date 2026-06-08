"use client"

import Image from "next/image"
import { useCallback, useEffect, useId, useState, type ReactNode } from "react"

import { LocaleSwitcher } from "@/app/components/vitrine/LocaleSwitcher"
import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"

import type { LandingLinks } from "./landing-links"

function NavAnchor({
  href,
  external,
  className,
  children,
  onClick,
}: {
  href: string
  external?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  if (external) {
    return (
      <a
        href={href}
        className={className}
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

export function LandingNav({ links }: { links: LandingLinks }) {
  const m = useVitrineMessages()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuId = useId()

  const navItems = [
    { href: "/apprendre", label: m.nav.learn, external: false },
    { href: "#produits", label: m.nav.products, external: false },
    { href: "#features", label: m.nav.features, external: false },
    { href: "#pricing", label: m.nav.pricing, external: false },
    { href: "#faq", label: m.nav.faq, external: false },
    { href: "#contact", label: m.nav.contact, external: false },
  ] as const

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen, closeMenu])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)")
    const onChange = () => {
      if (mq.matches) closeMenu()
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [closeMenu])

  return (
    <header
      className={`ds-header${scrolled ? " ds-header--scrolled" : ""}${menuOpen ? " ds-header--menu-open" : ""}`}
    >
      <div className="ds-container ds-header-container">
        <nav className="ds-nav" aria-label={m.nav.ariaMain}>
          <a href="/" className="ds-logo" aria-label={m.nav.logoAria}>
            <Image
              src="/brand/favicon/favicon-96x96.png"
              alt=""
              width={36}
              height={36}
              className="ds-logo-img"
              priority
            />
            Auto<span>via</span>
          </a>

          <div className="ds-nav-links" aria-label={m.nav.mobileSectionsAria}>
            {navItems.map((item) => (
              <NavAnchor key={item.href} href={item.href} external={item.external}>
                {item.label}
              </NavAnchor>
            ))}
            <NavAnchor href={links.candidatUrl} external className="ds-nav-link-candidat">
              {m.nav.candidateSpace}
            </NavAnchor>
          </div>

          <div className="ds-nav-end">
            <LocaleSwitcher />
            <div className="ds-nav-actions">
              <NavAnchor
                href={links.backdashSignIn}
                external
                className="ds-btn ds-btn-ghost ds-btn-nav"
              >
                {m.nav.signIn}
              </NavAnchor>
              <NavAnchor
                href={links.backdashSignUp}
                external
                className="ds-btn ds-btn-primary ds-btn-nav"
              >
                {m.nav.getStarted}
              </NavAnchor>
            </div>
            <div className="ds-nav-mobile-bar">
              <button
                type="button"
                className="ds-nav-toggle"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                aria-label={menuOpen ? m.nav.closeMenu : m.nav.openMenu}
                onClick={() => setMenuOpen((o) => !o)}
              >
                <span className="ds-nav-toggle-icon" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      <div
        id={menuId}
        className={`ds-mobile-menu${menuOpen ? " ds-mobile-menu--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="ds-mobile-menu-backdrop"
          aria-label={m.nav.closeMenu}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <div className="ds-mobile-menu-panel">
          <div className="ds-mobile-menu-head">
            <span className="ds-mobile-menu-title">{m.nav.menuTitle}</span>
            <button
              type="button"
              className="ds-mobile-menu-close"
              aria-label={m.nav.close}
              onClick={closeMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="ds-mobile-menu-links" aria-label={m.nav.mobileSectionsAria}>
            {navItems.map((item) => (
              <NavAnchor
                key={item.href}
                href={item.href}
                external={item.external}
                className="ds-mobile-menu-link"
                onClick={closeMenu}
              >
                {item.label}
              </NavAnchor>
            ))}
            <NavAnchor
              href={links.candidatUrl}
              external
              className="ds-mobile-menu-link ds-mobile-menu-link--highlight"
              onClick={closeMenu}
            >
              {m.nav.candidateSpace}
            </NavAnchor>
          </nav>

          <div className="ds-mobile-menu-cta">
            <NavAnchor
              href={links.candidatUrl}
              external
              className="ds-btn ds-btn-secondary ds-btn-block"
              onClick={closeMenu}
            >
              {m.nav.alreadyHaveCode}
            </NavAnchor>
            <NavAnchor
              href={links.backdashSignIn}
              external
              className="ds-btn ds-btn-ghost ds-btn-block"
              onClick={closeMenu}
            >
              {m.nav.schoolSignIn}
            </NavAnchor>
            <NavAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-primary ds-btn-block"
              onClick={closeMenu}
            >
              {m.nav.freeTrial}
            </NavAnchor>
          </div>
        </div>
      </div>
    </header>
  )
}
