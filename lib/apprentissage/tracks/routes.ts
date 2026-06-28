import type { TrackSlug } from "./types"

export function getTrackHref(slug: TrackSlug) {
  return `/apprendre/${slug}`
}

export function getPanneauxHref() {
  return "/apprendre/panneaux"
}

export function getPanneauCategoryHref(categorySlug: string) {
  return `/apprendre/panneaux/${categorySlug}`
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
