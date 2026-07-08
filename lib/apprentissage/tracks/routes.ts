import type { TrackSlug } from "./types"

export function getTrackHref(slug: TrackSlug) {
  return `/apprendre/${slug}`
}

export function getPanneauxHref() {
  return "/apprendre/panneaux"
}

export function getPanneauFamilyHref(familySlug: string) {
  return `/apprendre/panneaux/${familySlug}`
}

export function getPanneauCategoryHref(familySlug: string, categorySlug: string) {
  return `/apprendre/panneaux/${familySlug}/${categorySlug}`
}

/** @deprecated Anciennes URLs — préférer getPanneauCategoryHref(family, category) */
export function getPanneauCategoryHrefLegacy(categorySlug: string) {
  return `/apprendre/panneaux/${categorySlug}`
}

export function getPanneauSectionHref(
  familySlug: string,
  categorySlug: string,
  sectionSlug: string,
) {
  return `/apprendre/panneaux/${familySlug}/${categorySlug}/${sectionSlug}`
}

export function getPanneauxQuizHref() {
  return "/apprendre/panneaux/quiz"
}

export function getIntersectionsHref() {
  return "/apprendre/intersections"
}

export function getIntersectionTypeHref(typeSlug: string) {
  return `/apprendre/intersections/${typeSlug}`
}

export function getIntersectionsQuizHref() {
  return "/apprendre/intersections/quiz"
}
