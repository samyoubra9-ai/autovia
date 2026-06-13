import legalFr from "@/messages/legal-fr.json"
import legalKab from "@/messages/legal-kab.json"
import legalAr from "@/messages/legal-ar.json"

import type { VitrineLocale } from "./vitrine-locale"

export type LegalMessages = typeof legalFr
export type LegalDocumentKey = keyof LegalMessages

const catalogs: Record<VitrineLocale, LegalMessages> = {
  fr: legalFr,
  kab: legalKab as LegalMessages,
  ar: legalAr as LegalMessages,
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

export function getLegalMessages(locale: VitrineLocale): LegalMessages {
  if (locale === "fr") return catalogs.fr
  return mergeWithFallback(catalogs[locale], catalogs.fr) as LegalMessages
}

export function interpolateLegalText(
  text: string,
  vars: Record<string, string>,
): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`)
}

export const LEGAL_SLUGS = {
  "mentions-legales": "mentionsLegales",
  confidentialite: "confidentialite",
  cgu: "cgu",
} as const

export type LegalSlug = keyof typeof LEGAL_SLUGS

export function isLegalSlug(slug: string): slug is LegalSlug {
  return slug in LEGAL_SLUGS
}

export function getLegalDocumentKey(slug: LegalSlug): LegalDocumentKey {
  return LEGAL_SLUGS[slug]
}
