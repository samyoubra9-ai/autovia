"use client"

import { createEmptyProgress, QUIZ_PASS_THRESHOLD_PERCENT } from "./access"
import type { ApprentissageProgress, ChapterSlug, ModuleSlug } from "./types"

const STORAGE_KEY = "autovia-apprentissage-progress-v1"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function readProgress(): ApprentissageProgress {
  if (!isBrowser()) return createEmptyProgress()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProgress()
    const parsed = JSON.parse(raw) as ApprentissageProgress
    if (parsed.version !== 1 || !parsed.modules) return createEmptyProgress()
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function markChapterComplete(
  progress: ApprentissageProgress,
  moduleSlug: ModuleSlug,
  chapterSlug: ChapterSlug,
): ApprentissageProgress {
  const mod = progress.modules[moduleSlug]
  if (mod.chaptersCompleted.includes(chapterSlug)) return progress

  return {
    ...progress,
    modules: {
      ...progress.modules,
      [moduleSlug]: {
        ...mod,
        chaptersCompleted: [...mod.chaptersCompleted, chapterSlug],
      },
    },
    updatedAt: new Date().toISOString(),
  }
}

export function recordQuizScore(
  progress: ApprentissageProgress,
  moduleSlug: ModuleSlug,
  scorePercent: number,
): ApprentissageProgress {
  const mod = progress.modules[moduleSlug]
  const best =
    mod.quizBestScore === null
      ? scorePercent
      : Math.max(mod.quizBestScore, scorePercent)

  return {
    ...progress,
    modules: {
      ...progress.modules,
      [moduleSlug]: {
        ...mod,
        quizBestScore: best,
        quizPassed: best >= QUIZ_PASS_THRESHOLD_PERCENT,
        lastAttemptAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  }
}

export function resetProgress(): ApprentissageProgress {
  const empty = createEmptyProgress()
  writeProgress(empty)
  return empty
}
