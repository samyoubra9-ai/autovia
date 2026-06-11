"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  DEFAULT_VITRINE_LOCALE,
  isVitrineLocale,
  VITRINE_LOCALE_COOKIE,
} from "@/lib/i18n/vitrine-locale"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"

import { useCookieConsent } from "./CookieConsentProvider"
import "./cookie-consent-banner.css"

const HIDDEN_PATH_PREFIXES = ["/admin", "/signin", "/signup", "/setup-admin"]

function readVitrineLocaleFromDocument(): typeof DEFAULT_VITRINE_LOCALE {
  if (typeof document === "undefined") return DEFAULT_VITRINE_LOCALE
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${VITRINE_LOCALE_COOKIE}=([^;]*)`),
  )
  const raw = match?.[1] ? decodeURIComponent(match[1]) : null
  return isVitrineLocale(raw) ? raw : DEFAULT_VITRINE_LOCALE
}

export function CookieConsentBanner() {
  const pathname = usePathname()
  const { bannerOpen, acceptAll, rejectOptional } = useCookieConsent()
  const [visible, setVisible] = useState(false)
  const [locale, setLocale] = useState(DEFAULT_VITRINE_LOCALE)

  useEffect(() => {
    setLocale(readVitrineLocaleFromDocument())
  }, [pathname])

  useEffect(() => {
    if (bannerOpen) {
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
  }, [bannerOpen])

  const hidden = HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (hidden || !bannerOpen) return null

  const m = getVitrineMessages(locale).cookieConsent

  return (
    <div
      className={`cookie-consent${visible ? " cookie-consent--visible" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div className="cookie-consent__inner">
        <div className="cookie-consent__content">
          <p id="cookie-consent-title" className="cookie-consent__title">
            {m.title}
          </p>
          <p id="cookie-consent-desc" className="cookie-consent__text">
            {m.description}
          </p>
          <ul className="cookie-consent__list">
            <li>{m.necessary}</li>
            <li>{m.learning}</li>
            <li>{m.analytics}</li>
          </ul>
          <Link href="/legal/confidentialite#cookies" className="cookie-consent__link">
            {m.learnMore}
          </Link>
        </div>
        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--primary"
            onClick={acceptAll}
          >
            {m.acceptAll}
          </button>
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--secondary"
            onClick={rejectOptional}
          >
            {m.rejectOptional}
          </button>
        </div>
      </div>
    </div>
  )
}
