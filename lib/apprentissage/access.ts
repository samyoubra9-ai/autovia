import {
  APPRENTISSAGE_CURRICULUM,
  QUIZ_PASS_THRESHOLD_PERCENT,
  getModule,
} from "./curriculum"
import type {
  ApprentissageProgress,
  ChapterSlug,
  ModuleAccessState,
  ModuleSlug,
} from "./types"

export { QUIZ_PASS_THRESHOLD_PERCENT }

export function createEmptyProgress(): ApprentissageProgress {
  const modules = Object.fromEntries(
    APPRENTISSAGE_CURRICULUM.map((m) => [
      m.slug,
      {
        chaptersCompleted: [] as ChapterSlug[],
        quizBestScore: null,
        quizPassed: false,
        lastAttemptAt: null,
      },
    ]),
  ) as ApprentissageProgress["modules"]

  return {
    version: 1,
    modules,
    updatedAt: new Date().toISOString(),
  }
}

export function isQuizPassed(score: number | null): boolean {
  return score !== null && score >= QUIZ_PASS_THRESHOLD_PERCENT
}

export function isModuleUnlocked(
  moduleSlug: ModuleSlug,
  progress: ApprentissageProgress,
): boolean {
  const mod = getModule(moduleSlug)
  if (!mod.unlockAfterModule) return true
  return progress.modules[mod.unlockAfterModule].quizPassed
}

export function getModuleAccessState(
  moduleSlug: ModuleSlug,
  progress: ApprentissageProgress,
): ModuleAccessState {
  if (!isModuleUnlocked(moduleSlug, progress)) return "locked"

  const modProgress = progress.modules[moduleSlug]
  if (modProgress.quizPassed) return "completed"

  const mod = getModule(moduleSlug)
  const hasStarted =
    modProgress.chaptersCompleted.length > 0 || modProgress.quizBestScore !== null

  return hasStarted ? "in_progress" : "available"
}

export function getModuleCompletionPercent(
  moduleSlug: ModuleSlug,
  progress: ApprentissageProgress,
): number {
  const mod = getModule(moduleSlug)
  const modProgress = progress.modules[moduleSlug]
  const totalSteps = mod.chapterSlugs.length + 1
  let done = modProgress.chaptersCompleted.length
  if (modProgress.quizPassed) done += 1
  return Math.round((done / totalSteps) * 100)
}

export function getGlobalCompletionPercent(
  progress: ApprentissageProgress,
): number {
  const sum = APPRENTISSAGE_CURRICULUM.reduce(
    (acc, m) => acc + getModuleCompletionPercent(m.slug, progress),
    0,
  )
  return Math.round(sum / APPRENTISSAGE_CURRICULUM.length)
}
