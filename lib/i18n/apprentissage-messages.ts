import apprentissageFr from "@/messages/apprentissage-fr.json"
import apprentissageKab from "@/messages/apprentissage-kab.json"
import apprentissageAr from "@/messages/apprentissage-ar.json"

import type { VitrineLocale } from "./vitrine-locale"
import { formatVitrineMessage } from "./vitrine-messages"

export type ApprentissageMessages = typeof apprentissageFr

const catalogs: Record<VitrineLocale, ApprentissageMessages> = {
  fr: apprentissageFr,
  kab: (apprentissageKab as unknown) as ApprentissageMessages,
  ar: (apprentissageAr as unknown) as ApprentissageMessages,
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

export function getApprentissageMessages(
  locale: VitrineLocale,
): ApprentissageMessages {
  if (locale === "fr") return catalogs.fr
  return mergeWithFallback(catalogs[locale], catalogs.fr) as ApprentissageMessages
}

export function formatApprentissageMessage(
  template: string,
  vars: Record<string, string | number>,
): string {
  return formatVitrineMessage(template, vars)
}
