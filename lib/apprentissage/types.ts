import type { ProgrammeSection } from "./programme"

export type ModuleSlug =
  | "chapitre-1"
  | "chapitre-2"
  | "chapitre-3"
  | "chapitre-4"
  | "chapitre-5"

/** Slug de leçon (ex. 1-1-panneaux-danger) */
export type ChapterSlug = string

export type QuizMode = "training" | "exam"

export type CurriculumModule = {
  slug: ModuleSlug
  step: number
  chapterSlugs: readonly string[]
  sections: readonly ProgrammeSection[]
  quizSlug: string
  unlockAfterModule: ModuleSlug | null
}

export type QuizOption = {
  id: string
  label: string
}

export type ModuleProgress = {
  chaptersCompleted: string[]
  quizBestScore: number | null
  quizPassed: boolean
  lastAttemptAt: string | null
}

export type ApprentissageProgress = {
  version: 2
  modules: Record<ModuleSlug, ModuleProgress>
  updatedAt: string
}

export type ModuleAccessState = "locked" | "available" | "in_progress" | "completed"
