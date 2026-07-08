import { INTERSECTIONS } from "./content"
import {
  getIntersectionsHref,
  getIntersectionTypeHref,
  getIntersectionsQuizHref,
} from "./routes"

export type IntersectionStepDestination = {
  href: string
  label: string
}

export function getIntersectionTypesByGroup(groupSlug: string) {
  return INTERSECTIONS.types.filter((type) => type.group === groupSlug)
}

export function getNextIntersectionStep(
  typeSlug: string,
): IntersectionStepDestination | null {
  const types = INTERSECTIONS.types
  const index = types.findIndex((type) => type.slug === typeSlug)
  if (index < 0) return null

  const next = types[index + 1]
  if (next) {
    return {
      href: getIntersectionTypeHref(next.slug),
      label: next.title,
    }
  }

  return {
    href: getIntersectionsQuizHref(),
    label: "Quiz",
  }
}

export function getIntersectionGroupForType(typeSlug: string) {
  const type = INTERSECTIONS.types.find((t) => t.slug === typeSlug)
  if (!type) return null
  return INTERSECTIONS.groups.find((g) => g.slug === type.group) ?? null
}

export function getIntersectionsOverviewHref() {
  return getIntersectionsHref()
}
