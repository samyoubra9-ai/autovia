import type { ApprentissageProgress, TrackProgress, TrackSlug } from "./tracks/types"
import { QUIZ_PASS_THRESHOLD_PERCENT } from "./tracks/types"
import {
  countPanneauxSigns,
  familyHasFlatSigns,
  getAllPanneauSigns,
  getCategorySignCount,
  getFamilySignCount,
  getFamilySigns,
  getPanneauCategory,
  getPanneauFamily,
  getPanneauSection,
  categoryHasSections,
  INTERSECTIONS,
  PANNEAUX,
} from "./tracks/content"
import { signKey, sectionProgressKey } from "./tracks/types"

export { QUIZ_PASS_THRESHOLD_PERCENT }

function emptyTrackProgress(): TrackProgress {
  return {
    signsStudied: [],
    categoriesCompleted: [],
    quizBestScore: null,
    quizPassed: false,
  }
}

export function createEmptyProgress(): ApprentissageProgress {
  return {
    version: 3,
    panneaux: emptyTrackProgress(),
    intersections: {
      typesStudied: [],
      quizBestScore: null,
      quizPassed: false,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function isQuizPassed(score: number | null): boolean {
  return score !== null && score >= QUIZ_PASS_THRESHOLD_PERCENT
}

export function getPanneauxProgressPercent(progress: ApprentissageProgress): number {
  const total = countPanneauxSigns()
  if (total === 0) return 0
  return Math.round((progress.panneaux.signsStudied.length / total) * 100)
}

export function getPanneauxFamilyPercent(
  familySlug: string,
  progress: ApprentissageProgress,
): number {
  const family = getPanneauFamily(familySlug)
  if (!family) return 0

  if (familyHasFlatSigns(family)) {
    const total = getFamilySignCount(family)
    if (total === 0) return 0
    const studied = getFamilySigns(family).filter((s) =>
      progress.panneaux.signsStudied.includes(signKey(family.slug, s.id)),
    ).length
    return Math.round((studied / total) * 100)
  }

  const categories = family.categories ?? []
  if (categories.length === 0) return 0

  const sum = categories.reduce(
    (acc, cat) => acc + getPanneauxCategoryPercent(cat.slug, progress),
    0,
  )
  return Math.round(sum / categories.length)
}

export function getPanneauxCategoryPercent(
  categorySlug: string,
  progress: ApprentissageProgress,
): number {
  const cat = getPanneauCategory(categorySlug)
  if (!cat) return 0

  const total = getCategorySignCount(cat)
  if (total === 0) return 0

  if (categoryHasSections(cat)) {
    const studied = cat.sections!.reduce((count, section) => {
      return (
        count +
        section.signs.filter((s) =>
          progress.panneaux.signsStudied.includes(
            signKey(categorySlug, s.id, section.slug),
          ),
        ).length
      )
    }, 0)
    return Math.round((studied / total) * 100)
  }

  const studied = (cat.signs ?? []).filter((s) =>
    progress.panneaux.signsStudied.includes(signKey(categorySlug, s.id)),
  ).length
  return Math.round((studied / total) * 100)
}

export function getPanneauxSectionPercent(
  categorySlug: string,
  sectionSlug: string,
  progress: ApprentissageProgress,
): number {
  const section = getPanneauSection(categorySlug, sectionSlug)
  if (!section || section.signs.length === 0) return 0

  const studied = section.signs.filter((s) =>
    progress.panneaux.signsStudied.includes(
      signKey(categorySlug, s.id, sectionSlug),
    ),
  ).length
  return Math.round((studied / section.signs.length) * 100)
}

export function getIntersectionsProgressPercent(
  progress: ApprentissageProgress,
): number {
  const total = INTERSECTIONS.types.length
  if (total === 0) return 0
  return Math.round((progress.intersections.typesStudied.length / total) * 100)
}

export function getGlobalCompletionPercent(progress: ApprentissageProgress): number {
  const panneauxPart = getPanneauxProgressPercent(progress)
  const intPart = getIntersectionsProgressPercent(progress)
  const panneauxQuiz = progress.panneaux.quizPassed ? 100 : progress.panneaux.quizBestScore ?? 0
  const intQuiz =
    progress.intersections.quizPassed ? 100 : progress.intersections.quizBestScore ?? 0

  return Math.round((panneauxPart + intPart + panneauxQuiz + intQuiz) / 4)
}

export function isIntersectionsUnlocked(progress: ApprentissageProgress): boolean {
  return (
    progress.panneaux.quizPassed ||
    getPanneauxProgressPercent(progress) >= 50
  )
}

export function getStudiedSignsPool(progress: ApprentissageProgress) {
  const all = getAllPanneauSigns()
  const studied = new Set(progress.panneaux.signsStudied)
  const pool = all.filter((s) => studied.has(s.key))
  return pool.length >= 4 ? pool : all
}

export function getTrackLabel(slug: TrackSlug): string {
  return slug === "panneaux" ? PANNEAUX.title : INTERSECTIONS.title
}

export function tracksCompletedCount(progress: ApprentissageProgress): number {
  let n = 0
  if (progress.panneaux.quizPassed) n++
  if (progress.intersections.quizPassed) n++
  return n
}

export const TRACKS_TOTAL = 2
