"use client"

import Image from "next/image"
import { useCallback, useEffect, useId, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react"

import { LocaleSwitcher } from "@/app/components/vitrine/LocaleSwitcher"
import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"

import type { LandingLinks } from "./landing-links"

type NavItem = {
  href: string
  label: string
  external?: boolean
}

function NavAnchor({
  href,
  external,
  className,
  children,
  onClick,
  ...rest
}: {
  href: string
  external?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
} & AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (external) {
    return (
      <a href={href} className={className} rel="noopener noreferrer" onClick={onClick} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function NavMoreMenu({
  items,
  label,
  menuAria,
  onNavigate,
}: {
  items: NavItem[]
  label: string
  menuAria: string
  onNavigate?: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className={`ds-nav-dropdown${open ? " ds-nav-dropdown--open" : ""}`}>
      <button
        type="button"
        className="ds-nav-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronIcon />
      </button>
      <div id={menuId} className="ds-nav-dropdown-menu" role="menu" aria-label={menuAria}>
        {items.map((item) => (
          <NavAnchor
            key={item.href + item.label}
            href={item.href}
            external={item.external}
            className="ds-nav-dropdown-item"
            role="menuitem"
            onClick={() => {
              close()
              onNavigate?.()
            }}
          >
            {item.label}
          </NavAnchor>
        ))}
      </div>
    </div>
  )
}

function MobileNavGroup({
  title,
  items,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  onNavigate: () => void
}) {
  return (
    <div className="ds-mobile-menu-group">
      <p className="ds-mobile-menu-group-title">{title}</p>
      {items.map((item) => (
        <NavAnchor
          key={item.href + item.label}
          href={item.href}
          external={item.external}
          className="ds-mobile-menu-link"
          onClick={onNavigate}
        >
          {item.label}
        </NavAnchor>
      ))}
    </div>
  )
}

export function LandingNav({ links }: { links: LandingLinks }) {
  const m = useVitrineMessages()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuId = useId()

  const primaryNavItems: NavItem[] = [
    { href: "/apprendre", label: m.nav.learn },
    { href: "/inscription", label: m.nav.candidateDossier },
    { href: "/veille-reglementaire", label: m.nav.regulationWatch },
    { href: "/#pricing", label: m.nav.pricing },
  ]

  const moreNavItems: NavItem[] = [
    { href: "/#produits", label: m.nav.products },
    { href: "/#features", label: m.nav.features },
    { href: "/#faq", label: m.nav.faq },
    { href: "/#contact", label: m.nav.contact },
    { href: links.candidatUrl, label: m.nav.candidateSpace, external: true },
    { href: links.backdashSignIn, label: m.nav.signIn, external: true },
  ]

  const mobileGroups = [
    {
      title: m.nav.groupDiscover,
      items: [
        { href: "/apprendre", label: m.nav.learn },
        { href: "/inscription", label: m.nav.candidateDossier },
        { href: "/veille-reglementaire", label: m.nav.regulationWatch },
      ],
    },
    {
      title: m.nav.groupPlatform,
      items: [
        { href: "/#produits", label: m.nav.products },
        { href: "/#features", label: m.nav.features },
        { href: "/#pricing", label: m.nav.pricing },
      ],
    },
    {
      title: m.nav.groupHelp,
      items: [
        { href: "/#faq", label: m.nav.faq },
        { href: "/#contact", label: m.nav.contact },
      ],
    },
  ]

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
            {primaryNavItems.map((item) => (
              <NavAnchor key={item.href} href={item.href} external={item.external}>
                {item.label}
              </NavAnchor>
            ))}
            <NavMoreMenu items={moreNavItems} label={m.nav.more} menuAria={m.nav.moreMenuAria} />
          </div>

          <div className="ds-nav-end">
            <LocaleSwitcher />
            <div className="ds-nav-actions">
              <NavAnchor
                href={links.backdashSignIn}
                external
                className="ds-btn ds-btn-ghost ds-btn-nav ds-nav-signin"
              >
                {m.nav.signIn}
              </NavAnchor>
              <NavAnchor href={links.backdashSignUp} external className="ds-btn ds-btn-primary ds-btn-nav">
                {m.nav.getStarted}
              </NavAnchor>
            </div>
            <div className="ds-nav-mobile-bar">
              <NavAnchor
                href={links.backdashSignUp}
                external
                className="ds-btn ds-btn-primary ds-btn-sm ds-nav-mobile-cta"
              >
                {m.nav.getStarted}
              </NavAnchor>
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
            <button type="button" className="ds-mobile-menu-close" aria-label={m.nav.close} onClick={closeMenu}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="ds-mobile-menu-links" aria-label={m.nav.mobileSectionsAria}>
            {mobileGroups.map((group) => (
              <MobileNavGroup key={group.title} title={group.title} items={group.items} onNavigate={closeMenu} />
            ))}
            <div className="ds-mobile-menu-group">
              <p className="ds-mobile-menu-group-title">{m.nav.groupSpaces}</p>
              <NavAnchor
                href={links.candidatUrl}
                external
                className="ds-mobile-menu-link ds-mobile-menu-link--highlight"
                onClick={closeMenu}
              >
                {m.nav.candidateSpace}
              </NavAnchor>
            </div>
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
