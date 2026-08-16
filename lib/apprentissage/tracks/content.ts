import panneauxData from "@/content/apprentissage/panneaux.json"
import intersectionsData from "@/content/apprentissage/intersections.json"

import type {
  IntersectionGroup,
  IntersectionType,
  IntersectionsTrack,
  PanneauCategory,
  PanneauFamily,
  PanneauSection,
  PanneauSign,
  PanneauxTrack,
  SignQuizQuestion,
  TrackSlug,
} from "./types"
import { signKey } from "./types"
import { pickDistinctWrongLabels } from "@/lib/apprentissage/quiz"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

export const PANNEAUX = panneauxData as PanneauxTrack
export const INTERSECTIONS = intersectionsData as IntersectionsTrack

export const TRACKS = {
  panneaux: PANNEAUX,
  intersections: INTERSECTIONS,
} as const

export const PANNEAU_FAMILY_SLUGS = [
  "vertical",
  "horizontal",
  "lumineuse",
  "agent-ordre",
] as const
export type PanneauFamilySlug = (typeof PANNEAU_FAMILY_SLUGS)[number]

export function isTrackSlug(value: string): value is TrackSlug {
  return value === "panneaux" || value === "intersections"
}

export function isPanneauFamilySlug(value: string): value is PanneauFamilySlug {
  return PANNEAU_FAMILY_SLUGS.includes(value as PanneauFamilySlug)
}

export function getTrack(slug: TrackSlug) {
  return TRACKS[slug]
}

export function categoryHasSections(cat: PanneauCategory): boolean {
  return (cat.sections?.length ?? 0) > 0
}

export function getCategorySignCount(cat: PanneauCategory): number {
  if (categoryHasSections(cat)) {
    return cat.sections!.reduce((n, section) => n + section.signs.length, 0)
  }
  return cat.signs?.length ?? 0
}

export function familyHasFlatSigns(family: PanneauFamily): boolean {
  return family.signs !== undefined
}

export function getFamilySignCount(family: PanneauFamily): number {
  return family.signs?.length ?? 0
}

export function getFamilySigns(family: PanneauFamily): PanneauSign[] {
  return family.signs ?? []
}

export function getPanneauFamilies(): PanneauFamily[] {
  return PANNEAUX.families
}

export function getPanneauFamily(slug: string): PanneauFamily | null {
  return PANNEAUX.families.find((f) => f.slug === slug) ?? null
}

/** Toutes les catégories (verticale uniquement). */
export function getAllPanneauCategories(): PanneauCategory[] {
  return PANNEAUX.families.flatMap((f) => f.categories ?? [])
}

export function getPanneauCategory(slug: string): PanneauCategory | null {
  return getAllPanneauCategories().find((c) => c.slug === slug) ?? null
}

export function getPanneauCategoryInFamily(
  familySlug: string,
  categorySlug: string,
): PanneauCategory | null {
  const family = getPanneauFamily(familySlug)
  return family?.categories?.find((c) => c.slug === categorySlug) ?? null
}

export function getPanneauSection(
  categorySlug: string,
  sectionSlug: string,
): PanneauSection | null {
  const cat = getPanneauCategory(categorySlug)
  return cat?.sections?.find((s) => s.slug === sectionSlug) ?? null
}

export function isPanneauCategory(slug: string): boolean {
  return getAllPanneauCategories().some((c) => c.slug === slug)
}

export function isPanneauSection(categorySlug: string, sectionSlug: string): boolean {
  return getPanneauSection(categorySlug, sectionSlug) !== null
}

export function getAllPanneauSigns(): Array<
  PanneauSign & {
    categorySlug: string
    familySlug: string
    sectionSlug?: string
    key: string
  }
> {
  return PANNEAUX.families.flatMap((family) => {
    if (familyHasFlatSigns(family)) {
      return getFamilySigns(family).map((sign) => ({
        ...sign,
        familySlug: family.slug,
        categorySlug: family.slug,
        key: signKey(family.slug, sign.id),
      }))
    }

    return (family.categories ?? []).flatMap((cat) => {
      if (categoryHasSections(cat)) {
        return cat.sections!.flatMap((section) =>
          section.signs.map((sign) => ({
            ...sign,
            familySlug: family.slug,
            categorySlug: cat.slug,
            sectionSlug: section.slug,
            key: signKey(cat.slug, sign.id, section.slug),
          })),
        )
      }
      return (cat.signs ?? []).map((sign) => ({
        ...sign,
        familySlug: family.slug,
        categorySlug: cat.slug,
        key: signKey(cat.slug, sign.id),
      }))
    })
  })
}

export function getPanneauSign(
  categorySlug: string,
  signId: string,
  sectionSlug?: string,
): (PanneauSign & {
  categorySlug: string
  familySlug: string
  sectionSlug?: string
}) | null {
  for (const family of PANNEAUX.families) {
    if (familyHasFlatSigns(family) && categorySlug === family.slug) {
      const sign = getFamilySigns(family).find((s) => s.id === signId)
      if (sign) {
        return { ...sign, categorySlug: family.slug, familySlug: family.slug }
      }
      continue
    }

    const cat = family.categories?.find((c) => c.slug === categorySlug)
    if (!cat) continue

    if (categoryHasSections(cat)) {
      for (const section of cat.sections!) {
        if (sectionSlug && section.slug !== sectionSlug) continue
        const sign = section.signs.find((s) => s.id === signId)
        if (sign) {
          return {
            ...sign,
            categorySlug: cat.slug,
            familySlug: family.slug,
            sectionSlug: section.slug,
          }
        }
      }
      continue
    }

    const sign = cat.signs?.find((s) => s.id === signId)
    if (sign) {
      return { ...sign, categorySlug: cat.slug, familySlug: family.slug }
    }
  }
  return null
}

export function getIntersectionGroups() {
  return INTERSECTIONS.groups
}

export function getIntersectionType(slug: string): IntersectionType | null {
  return INTERSECTIONS.types.find((t) => t.slug === slug) ?? null
}

export function isIntersectionType(slug: string): boolean {
  return INTERSECTIONS.types.some((t) => t.slug === slug)
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Quiz panneaux : image aléatoire, 4 propositions distinctes */
export function buildSignQuizQuestions(
  pool: Array<PanneauSign & { categorySlug: string; key: string }>,
  count: number,
  locale: VitrineLocale = "fr",
): SignQuizQuestion[] {
  const withNames = pool.filter((s) => s.name.trim().length > 0)
  if (withNames.length < 4) return []

  const allNames = withNames.map((s) => s.name.trim())
  const picked: Array<PanneauSign & { categorySlug: string; key: string }> = []
  const usedNames = new Set<string>()

  for (const sign of shuffle(withNames)) {
    const key = sign.name.trim().toLowerCase()
    if (usedNames.has(key)) continue
    usedNames.add(key)
    picked.push(sign)
    if (picked.length >= Math.min(count, withNames.length)) break
  }

  return picked.map((sign) => {
    const correctName = sign.name.trim()
    const localizedCorrect = tTrack(correctName, locale)
    const wrongLabels = pickDistinctWrongLabels(correctName, allNames, 3).map(
      (label) => tTrack(label, locale),
    )
    const options = shuffle([
      { id: "correct", label: localizedCorrect },
      ...wrongLabels.map((label, i) => ({ id: `w${i}`, label })),
    ])

    const meaning = sign.meaning.trim()
    const explanation =
      meaning.length > 0
        ? tTrack(meaning, locale)
        : locale === "kab"
          ? `Tafewwit-agi qqaren-as « ${localizedCorrect} ».`
          : `Ce panneau s'appelle « ${correctName} ».`

    return {
      id: `sign-${sign.key}`,
      signKey: sign.key,
      categorySlug: sign.categorySlug,
      signId: sign.id,
      image: sign.image,
      prompt: tTrack("Quel est le nom de ce panneau ?", locale),
      options,
      correctOptionId: "correct",
      explanation,
    }
  })
}

export function countPanneauxSigns() {
  return getAllPanneauSigns().length
}

export function countPanneauxCategories() {
  return getAllPanneauCategories().length
}
