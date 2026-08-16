import chapitre1 from "@/content/apprentissage/chapitre-1.json"

import type { ProgrammeChapitreJson, ProgrammeSection } from "./types"

export type { ProgrammeLesson, ProgrammeSection } from "./types"

const data = chapitre1 as ProgrammeChapitreJson

export const CHAPITRE_1_SLUG = data.slug

export const CHAPITRE_1_META = {
  slug: data.slug,
  step: data.step,
  title: data.title,
  subtitle: data.subtitle,
  description: data.description,
  quizSlug: data.quizSlug,
} as const

export const CHAPITRE_1_SECTIONS: ProgrammeSection[] = data.sections

export const CHAPITRE_1_LESSON_SLUGS = CHAPITRE_1_SECTIONS.flatMap((s) =>
  s.lessons.map((l) => l.slug),
)
