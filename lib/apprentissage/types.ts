/** Identifiants stables du curriculum — ne pas renommer sans migration. */
export const MODULE_SLUGS = [
  "fondamentaux",
  "circulation",
  "conducteur",
  "situations",
] as const

export type ModuleSlug = (typeof MODULE_SLUGS)[number]

export type ChapterSlug =
  | "panneaux"
  | "marquage"
  | "feux"
  | "intersections"
  | "ronds-points"
  | "depassement"
  | "vitesse"
  | "visibilite"
  | "eco-conduite"
  | "autoroutes"
  | "partage-route"
  | "secourisme"

export type QuizMode = "training" | "exam"

export type CurriculumChapter = {
  slug: ChapterSlug
  order: number
}

export type CurriculumModule = {
  slug: ModuleSlug
  step: number
  chapterSlugs: readonly ChapterSlug[]
  /** Quiz de validation en fin de module */
  quizSlug: string
  /** Module précédent requis (score quiz ≥ seuil) */
  unlockAfterModule: ModuleSlug | null
}

export type QuizOption = {
  id: string
  label: string
}

export type ModuleProgress = {
  chaptersCompleted: ChapterSlug[]
  quizBestScore: number | null
  quizPassed: boolean
  lastAttemptAt: string | null
}

export type ApprentissageProgress = {
  version: 1
  modules: Record<ModuleSlug, ModuleProgress>
  updatedAt: string
}

export type ModuleAccessState = "locked" | "available" | "in_progress" | "completed"
