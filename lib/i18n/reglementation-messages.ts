import reglementationFr from "@/messages/reglementation-fr.json"
import reglementationKab from "@/messages/reglementation-kab.json"
import reglementationAr from "@/messages/reglementation-ar.json"

import type { VitrineLocale } from "./vitrine-locale"

export type ReglementationMessages = typeof reglementationFr

const catalogs: Record<VitrineLocale, ReglementationMessages> = {
  fr: reglementationFr,
  kab: reglementationKab as ReglementationMessages,
  ar: reglementationAr as ReglementationMessages,
}

function isEmptyString(value: unknown): value is "" {
  return typeof value === "string" && value.trim() === ""
}

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
    if (localeMessages.length === 0 && fallbackMessages.length > 0) {
      return fallbackMessages
    }
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

export function getReglementationMessages(
  locale: VitrineLocale,
): ReglementationMessages {
  if (locale === "fr") return catalogs.fr
  return mergeWithFallback(catalogs[locale], catalogs.fr) as ReglementationMessages
}

export function formatReglementationDate(
  isoDate: string,
  locale: VitrineLocale = "fr",
): string {
  try {
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(isoDate))
  } catch {
    return isoDate
  }
}
