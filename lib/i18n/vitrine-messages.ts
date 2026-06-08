import fr from "@/messages/fr.json"
import kab from "@/messages/kab.json"

import type { VitrineLocale } from "./vitrine-locale"

export type VitrineMessages = typeof fr

const catalogs: Record<VitrineLocale, VitrineMessages> = {
  fr,
  kab: kab as VitrineMessages,
}

function isEmptyString(value: unknown): value is "" {
  return typeof value === "string" && value.trim() === ""
}

/** Fusionne kabyle + français : texte kabyle vide → fallback FR. */
function mergeWithFallback(
  localeMessages: unknown,
  fallbackMessages: unknown,
): unknown {
  if (typeof localeMessages === "string") {
    if (isEmptyString(localeMessages) && typeof fallbackMessages === "string") {
      return fallbackMessages
    }
    return localeMessages
  }

  if (Array.isArray(localeMessages) && Array.isArray(fallbackMessages)) {
    return localeMessages.map((item, index) =>
      mergeWithFallback(item, fallbackMessages[index]),
    )
  }

  if (
    localeMessages &&
    typeof localeMessages === "object" &&
    fallbackMessages &&
    typeof fallbackMessages === "object" &&
    !Array.isArray(localeMessages)
  ) {
    const localeRecord = localeMessages as Record<string, unknown>
    const fallbackRecord = fallbackMessages as Record<string, unknown>
    const merged: Record<string, unknown> = {}

    for (const key of Object.keys(fallbackRecord)) {
      merged[key] = mergeWithFallback(localeRecord[key], fallbackRecord[key])
    }

    return merged
  }

  return localeMessages ?? fallbackMessages
}

export function getVitrineMessages(locale: VitrineLocale): VitrineMessages {
  if (locale === "fr") return catalogs.fr
  return mergeWithFallback(catalogs.kab, catalogs.fr) as VitrineMessages
}

/** Remplace `{key}` dans un modèle de texte. */
export function formatVitrineMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}
