import tracksKab from "@/messages/tracks-kab.json"

import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import type { IntersectionQuizQuestion, IntersectionType } from "./types"

const catalogs: Partial<Record<VitrineLocale, Record<string, string>>> = {
  kab: tracksKab as Record<string, string>,
}

const lowerIndexByLocale = new Map<VitrineLocale, Map<string, string>>()

function getLowerIndex(locale: VitrineLocale): Map<string, string> {
  const cached = lowerIndexByLocale.get(locale)
  if (cached) return cached

  const dict = catalogs[locale] ?? {}
  const index = new Map<string, string>()
  for (const [source, translated] of Object.entries(dict)) {
    const key = source.trim().toLowerCase()
    if (key && translated.trim()) index.set(key, translated)
  }
  lowerIndexByLocale.set(locale, index)
  return index
}

/** Traduit un texte de contenu d'apprentissage (panneaux, intersections). */
export function tTrack(text: string, locale: VitrineLocale): string {
  if (!text || locale === "fr") return text
  const dict = catalogs[locale]
  if (!dict) return text
  if (dict[text]?.trim()) return dict[text]
  const trimmed = text.trim()
  if (dict[trimmed]?.trim()) return dict[trimmed]
  return getLowerIndex(locale).get(trimmed.toLowerCase()) ?? text
}

export function localizeIntersectionType(
  type: IntersectionType,
  locale: VitrineLocale,
): IntersectionType {
  if (locale === "fr") return type
  return {
    ...type,
    title: tTrack(type.title, locale),
    summary: tTrack(type.summary, locale),
    body: tTrack(type.body, locale),
    rules: type.rules.map((rule) => tTrack(rule, locale)),
    sign: type.sign
      ? { ...type.sign, name: tTrack(type.sign.name, locale) }
      : type.sign,
    scenario: type.scenario
      ? {
          ...type.scenario,
          caption: tTrack(type.scenario.caption, locale),
          passingOrder: type.scenario.passingOrder,
        }
      : type.scenario,
  }
}

export function localizeQuizQuestion(
  question: IntersectionQuizQuestion,
  locale: VitrineLocale,
): IntersectionQuizQuestion {
  if (locale === "fr") return question
  return {
    ...question,
    prompt: tTrack(question.prompt, locale),
    explanation: tTrack(question.explanation, locale),
    options: question.options.map((option) => ({
      ...option,
      label: tTrack(option.label, locale),
    })),
  }
}
