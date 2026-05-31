"use client"

import Image from "next/image"
import { useCallback, useEffect, useId, useState, type ReactNode } from "react"

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

const NAV_ITEMS = [
  { href: "/apprendre", label: "Apprendre", external: false },
  { href: "#produits", label: "Produits", external: false },
  { href: "#features", label: "Fonctionnalités", external: false },
  { href: "#pricing", label: "Tarifs", external: false },
  { href: "#faq", label: "FAQ", external: false },
  { href: "#contact", label: "Contact", external: false },
] as const

export function LandingNav({ links }: { links: LandingLinks }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuId = useId()

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
    const mq = window.matchMedia("(min-width: 1024px)")
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
      <div className="ds-container">
        <nav className="ds-nav" aria-label="Navigation principale">
          <a href="/" className="ds-logo" aria-label="Autovia — accueil">
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

          <div className="ds-nav-desktop">
            <div className="ds-nav-links">
              {NAV_ITEMS.map((item) => (
                <NavAnchor key={item.href} href={item.href} external={item.external}>
                  {item.label}
                </NavAnchor>
              ))}
              <NavAnchor href={links.candidatUrl} external className="ds-nav-link-candidat">
                Espace candidat
              </NavAnchor>
            </div>
            <div className="ds-nav-actions">
              <NavAnchor
                href={links.backdashSignIn}
                external
                className="ds-btn ds-btn-ghost"
              >
                Connexion
              </NavAnchor>
              <NavAnchor
                href={links.backdashSignUp}
                external
                className="ds-btn ds-btn-primary"
              >
                Démarrer
              </NavAnchor>
            </div>
          </div>

          <div className="ds-nav-mobile-bar">
            <NavAnchor
              href={links.candidatUrl}
              external
              className="ds-btn ds-btn-ghost ds-btn-sm ds-nav-mobile-code"
            >
              Mon code
            </NavAnchor>
            <button
              type="button"
              className="ds-nav-toggle"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="ds-nav-toggle-icon" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
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
          aria-label="Fermer le menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
        />
        <div className="ds-mobile-menu-panel">
          <div className="ds-mobile-menu-head">
            <span className="ds-mobile-menu-title">Menu</span>
            <button
              type="button"
              className="ds-mobile-menu-close"
              aria-label="Fermer"
              onClick={closeMenu}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="ds-mobile-menu-links" aria-label="Sections">
            {NAV_ITEMS.map((item) => (
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
              Espace candidat
            </NavAnchor>
          </nav>

          <div className="ds-mobile-menu-cta">
            <NavAnchor
              href={links.candidatUrl}
              external
              className="ds-btn ds-btn-secondary ds-btn-block"
              onClick={closeMenu}
            >
              J&apos;ai déjà mon code
            </NavAnchor>
            <NavAnchor
              href={links.backdashSignIn}
              external
              className="ds-btn ds-btn-ghost ds-btn-block"
              onClick={closeMenu}
            >
              Connexion auto-école
            </NavAnchor>
            <NavAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-primary ds-btn-block"
              onClick={closeMenu}
            >
              Essai gratuit
            </NavAnchor>
          </div>
        </div>
      </div>
    </header>
  )
}
