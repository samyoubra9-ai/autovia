"use client"

import {
  VITRINE_LOCALES,
  VITRINE_LOCALE_SHORT,
  type VitrineLocale,
} from "@/lib/i18n/vitrine-locale"

import { useVitrineLocale } from "./VitrineLocaleProvider"

const LOCALE_SWITCH_KEY: Record<VitrineLocale, "switchToFr" | "switchToKab" | "switchToAr"> = {
  fr: "switchToFr",
  kab: "switchToKab",
  ar: "switchToAr",
}

export function LocaleSwitcher() {
  const { locale, messages, setLocale } = useVitrineLocale()

  return (
    <div className="ds-locale-switcher" role="group" aria-label="Langue">
      {VITRINE_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`ds-locale-btn${locale === loc ? " ds-locale-btn--active" : ""}`}
          aria-pressed={locale === loc}
          aria-label={messages.locale[LOCALE_SWITCH_KEY[loc]]}
          onClick={() => setLocale(loc)}
        >
          {VITRINE_LOCALE_SHORT[loc]}
        </button>
      ))}
    </div>
  )
}
