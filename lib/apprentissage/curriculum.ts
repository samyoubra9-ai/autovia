import {
  CHAPITRE_1_LESSON_SLUGS,
  CHAPITRE_1_META,
  CHAPITRE_1_SECTIONS,
  CHAPITRES_PROGRAMME,
  getProgrammeSections,
  type ProgrammeChapitreSlug,
} from "./programme"
import type { CurriculumModule, ModuleSlug } from "./types"

export const QUIZ_PASS_THRESHOLD_PERCENT = 80

export const MODULE_SLUGS: ModuleSlug[] = [
  "chapitre-1",
  "chapitre-2",
  "chapitre-3",
  "chapitre-4",
  "chapitre-5",
]

function buildChapitre1Module(): CurriculumModule {
  return {
    slug: CHAPITRE_1_META.slug as ModuleSlug,
    step: CHAPITRE_1_META.step,
    chapterSlugs: CHAPITRE_1_LESSON_SLUGS,
    sections: CHAPITRE_1_SECTIONS,
    quizSlug: CHAPITRE_1_META.quizSlug,
    unlockAfterModule: null,
  }
}

function buildPlaceholderModule(
  slug: ProgrammeChapitreSlug,
  step: number,
  unlockAfter: ModuleSlug | null,
): CurriculumModule {
  return {
    slug,
    step,
    chapterSlugs: [],
    sections: [],
    quizSlug: `quiz-${slug}`,
    unlockAfterModule: unlockAfter,
  }
}

export const APPRENTISSAGE_CURRICULUM: readonly CurriculumModule[] = [
  buildChapitre1Module(),
  buildPlaceholderModule("chapitre-2", 2, "chapitre-1"),
  buildPlaceholderModule("chapitre-3", 3, "chapitre-2"),
  buildPlaceholderModule("chapitre-4", 4, "chapitre-3"),
  buildPlaceholderModule("chapitre-5", 5, "chapitre-4"),
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
): boolean {
  const mod = getModule(moduleSlug)
  return mod.chapterSlugs.includes(chapterSlug)
}

export function getModuleHref(slug: ModuleSlug): string {
  return `/apprendre/${slug}`
}

export function getChapterHref(
  moduleSlug: ModuleSlug,
  chapterSlug: string,
): string {
  return `/apprendre/${moduleSlug}/${chapterSlug}`
}

export function getQuizHref(moduleSlug: ModuleSlug): string {
  return `/apprendre/${moduleSlug}/quiz`
}

export { getProgrammeSections }
