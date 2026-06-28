import type { ApprentissageProgress, TrackProgress, TrackSlug } from "./tracks/types"
import { QUIZ_PASS_THRESHOLD_PERCENT } from "./tracks/types"
import {
  countPanneauxSigns,
  getAllPanneauSigns,
  INTERSECTIONS,
  PANNEAUX,
} from "./tracks/content"

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

export function getPanneauxCategoryPercent(
  categorySlug: string,
  progress: ApprentissageProgress,
): number {
  const cat = PANNEAUX.categories.find((c) => c.slug === categorySlug)
  if (!cat || cat.signs.length === 0) return 0
  const studied = cat.signs.filter((s) =>
    progress.panneaux.signsStudied.includes(`${categorySlug}:${s.id}`),
  ).length
  return Math.round((studied / cat.signs.length) * 100)
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
