import panneauxData from "@/content/apprentissage/panneaux.json"
import intersectionsData from "@/content/apprentissage/intersections.json"

import type {
  IntersectionType,
  IntersectionsTrack,
  PanneauCategory,
  PanneauSign,
  PanneauxTrack,
  SignQuizQuestion,
  TrackSlug,
} from "./types"
import { signKey } from "./types"

export const PANNEAUX = panneauxData as PanneauxTrack
export const INTERSECTIONS = intersectionsData as IntersectionsTrack

export const TRACKS = {
  panneaux: PANNEAUX,
  intersections: INTERSECTIONS,
} as const

export function isTrackSlug(value: string): value is TrackSlug {
  return value === "panneaux" || value === "intersections"
}

export function getTrack(slug: TrackSlug) {
  return TRACKS[slug]
}

export function getPanneauCategory(slug: string): PanneauCategory | null {
  return PANNEAUX.categories.find((c) => c.slug === slug) ?? null
}

export function isPanneauCategory(slug: string): boolean {
  return PANNEAUX.categories.some((c) => c.slug === slug)
}

export function getAllPanneauSigns(): Array<
  PanneauSign & { categorySlug: string; key: string }
> {
  return PANNEAUX.categories.flatMap((cat) =>
    cat.signs.map((sign) => ({
      ...sign,
      categorySlug: cat.slug,
      key: signKey(cat.slug, sign.id),
    })),
  )
}

export function getPanneauSign(
  categorySlug: string,
  signId: string,
): (PanneauSign & { categorySlug: string }) | null {
  const cat = getPanneauCategory(categorySlug)
  const sign = cat?.signs.find((s) => s.id === signId)
  if (!cat || !sign) return null
  return { ...sign, categorySlug: cat.slug }
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

/** Quiz panneaux : image aléatoire, 4 noms possibles */
export function buildSignQuizQuestions(
  pool: Array<PanneauSign & { categorySlug: string; key: string }>,
  count: number,
): SignQuizQuestion[] {
  if (pool.length < 4) return []

  const picked = shuffle(pool).slice(0, Math.min(count, pool.length))
  const allNames = pool.map((s) => s.name)

  return picked.map((sign) => {
    const wrong = shuffle(
      allNames.filter((n) => n !== sign.name),
    ).slice(0, 3)
    const options = shuffle([
      { id: "correct", label: sign.name },
      ...wrong.map((label, i) => ({ id: `w${i}`, label })),
    ])

    return {
      id: `sign-${sign.key}`,
      signKey: sign.key,
      categorySlug: sign.categorySlug,
      signId: sign.id,
      image: sign.image,
      prompt: "Quel est le nom de ce panneau ?",
      options,
      correctOptionId: "correct",
      explanation: sign.meaning,
    }
  })
}

export function countPanneauxSigns() {
  return getAllPanneauSigns().length
}

export function countPanneauxCategories() {
  return PANNEAUX.categories.length
}
