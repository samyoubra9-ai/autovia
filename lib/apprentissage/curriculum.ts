import type { ChapterSlug, CurriculumModule, ModuleSlug } from "./types"

export const QUIZ_PASS_THRESHOLD_PERCENT = 80

export const APPRENTISSAGE_CURRICULUM: readonly CurriculumModule[] = [
  {
    slug: "fondamentaux",
    step: 1,
    chapterSlugs: ["panneaux", "marquage", "feux"],
    quizSlug: "quiz-fondamentaux",
    unlockAfterModule: null,
  },
  {
    slug: "circulation",
    step: 2,
    chapterSlugs: ["intersections", "ronds-points", "depassement"],
    quizSlug: "quiz-circulation",
    unlockAfterModule: "fondamentaux",
  },
  {
    slug: "conducteur",
    step: 3,
    chapterSlugs: ["vitesse", "visibilite", "eco-conduite"],
    quizSlug: "quiz-conducteur",
    unlockAfterModule: "circulation",
  },
  {
    slug: "situations",
    step: 4,
    chapterSlugs: ["autoroutes", "partage-route", "secourisme"],
    quizSlug: "quiz-situations",
    unlockAfterModule: "conducteur",
  },
] as const

export function isModuleSlug(value: string): value is ModuleSlug {
  return APPRENTISSAGE_CURRICULUM.some((m) => m.slug === value)
}

export function getModule(slug: ModuleSlug): CurriculumModule {
  const mod = APPRENTISSAGE_CURRICULUM.find((m) => m.slug === slug)
  if (!mod) throw new Error(`Unknown module: ${slug}`)
  return mod
}

export function isChapterInModule(
  moduleSlug: ModuleSlug,
  chapterSlug: string,
): chapterSlug is ChapterSlug {
  const mod = getModule(moduleSlug)
  return (mod.chapterSlugs as readonly string[]).includes(chapterSlug)
}

export function getModuleHref(slug: ModuleSlug): string {
  return `/apprendre/${slug}`
}

export function getChapterHref(
  moduleSlug: ModuleSlug,
  chapterSlug: ChapterSlug,
): string {
  return `/apprendre/${moduleSlug}/${chapterSlug}`
}

export function getQuizHref(moduleSlug: ModuleSlug): string {
  return `/apprendre/${moduleSlug}/quiz`
}
