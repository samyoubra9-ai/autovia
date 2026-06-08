"use client"

import { useVitrineLocale } from "./VitrineLocaleProvider"

export function LocaleSwitcher() {
  const { locale, messages, setLocale } = useVitrineLocale()

  return (
    <div className="ds-locale-switcher" role="group" aria-label="Langue">
      <button
        type="button"
        className={`ds-locale-btn${locale === "fr" ? " ds-locale-btn--active" : ""}`}
        aria-pressed={locale === "fr"}
        aria-label={messages.locale.switchToFr}
        onClick={() => setLocale("fr")}
      >
        FR
      </button>
      <button
        type="button"
        className={`ds-locale-btn${locale === "kab" ? " ds-locale-btn--active" : ""}`}
        aria-pressed={locale === "kab"}
        aria-label={messages.locale.switchToKab}
        onClick={() => setLocale("kab")}
      >
        KAB
      </button>
    </div>
  )
}
