"use client"

import type { ApprentissageProgress } from "./tracks/types"
import { createEmptyProgress } from "./access"

export const STORAGE_KEY = "autovia-apprentissage-progress-v3"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function readProgress(): ApprentissageProgress {
  if (!isBrowser()) return createEmptyProgress()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProgress()
    const parsed = JSON.parse(raw) as ApprentissageProgress
    if (parsed.version !== 3) return createEmptyProgress()
    return parsed
  } catch {
    return createEmptyProgress()
  }
}

export function writeProgress(progress: ApprentissageProgress): void {
  if (!isBrowser()) return
  const next: ApprentissageProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function markSignStudied(
  progress: ApprentissageProgress,
  signKey: string,
): ApprentissageProgress {
  if (progress.panneaux.signsStudied.includes(signKey)) return progress
  return {
    ...progress,
    panneaux: {
      ...progress.panneaux,
      signsStudied: [...progress.panneaux.signsStudied, signKey],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function markSignUnstudied(
  progress: ApprentissageProgress,
  signKey: string,
): ApprentissageProgress {
  if (!progress.panneaux.signsStudied.includes(signKey)) return progress
  return {
    ...progress,
    panneaux: {
      ...progress.panneaux,
      signsStudied: progress.panneaux.signsStudied.filter((key) => key !== signKey),
    },
    updatedAt: new Date().toISOString(),
  }
}

export function markCategoryCompleted(
  progress: ApprentissageProgress,
  categorySlug: string,
): ApprentissageProgress {
  const set = new Set(progress.panneaux.categoriesCompleted)
  set.add(categorySlug)
  return {
    ...progress,
    panneaux: {
      ...progress.panneaux,
      categoriesCompleted: [...set],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function unmarkCategoryCompleted(
  progress: ApprentissageProgress,
  categorySlug: string,
): ApprentissageProgress {
  if (!progress.panneaux.categoriesCompleted.includes(categorySlug)) return progress
  return {
    ...progress,
    panneaux: {
      ...progress.panneaux,
      categoriesCompleted: progress.panneaux.categoriesCompleted.filter(
        (key) => key !== categorySlug,
      ),
    },
    updatedAt: new Date().toISOString(),
  }
}

export function markIntersectionStudied(
  progress: ApprentissageProgress,
  typeSlug: string,
): ApprentissageProgress {
  if (progress.intersections.typesStudied.includes(typeSlug)) return progress
  return {
    ...progress,
    intersections: {
      ...progress.intersections,
      typesStudied: [...progress.intersections.typesStudied, typeSlug],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function markIntersectionUnstudied(
  progress: ApprentissageProgress,
  typeSlug: string,
): ApprentissageProgress {
  if (!progress.intersections.typesStudied.includes(typeSlug)) return progress
  return {
    ...progress,
    intersections: {
      ...progress.intersections,
      typesStudied: progress.intersections.typesStudied.filter(
        (slug) => slug !== typeSlug,
      ),
    },
    updatedAt: new Date().toISOString(),
  }
}

export function recordPanneauxQuizScore(
  progress: ApprentissageProgress,
  scorePercent: number,
  passPercent: number,
): ApprentissageProgress {
  const best = Math.max(progress.panneaux.quizBestScore ?? 0, scorePercent)
  return {
    ...progress,
    panneaux: {
      ...progress.panneaux,
      quizBestScore: best,
      quizPassed: best >= passPercent,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function recordIntersectionsQuizScore(
  progress: ApprentissageProgress,
  scorePercent: number,
  passPercent: number,
): ApprentissageProgress {
  const best = Math.max(progress.intersections.quizBestScore ?? 0, scorePercent)
  return {
    ...progress,
    intersections: {
      ...progress.intersections,
      quizBestScore: best,
      quizPassed: best >= passPercent,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function resetProgress(): ApprentissageProgress {
  const empty = createEmptyProgress()
  writeProgress(empty)
  return empty
}

export function clearProgressStorage(): void {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEY)
}
