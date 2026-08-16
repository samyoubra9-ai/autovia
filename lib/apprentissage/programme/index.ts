import {
  CHAPITRE_1_LESSON_SLUGS,
  CHAPITRE_1_META,
  CHAPITRE_1_SECTIONS,
  CHAPITRE_1_SLUG,
} from "./chapitre-1"
import type { ProgrammeLesson, ProgrammeSection } from "./types"

export {
  CHAPITRE_1_LESSON_SLUGS,
  CHAPITRE_1_META,
  CHAPITRE_1_SECTIONS,
  CHAPITRE_1_SLUG,
  type ProgrammeLesson,
  type ProgrammeSection,
}

export const CHAPITRES_PROGRAMME = [
  CHAPITRE_1_META,
  {
    slug: "chapitre-2",
    step: 2,
    title: "Notions générales sur le véhicule",
    subtitle: "Bientôt disponible",
    description: "Moteur, transmission, freinage, voyants et feux.",
    quizSlug: "quiz-chapitre-2",
  },
  {
    slug: "chapitre-3",
    step: 3,
    title: "Conduite plus sûre et éthique du conducteur",
    subtitle: "Bientôt disponible",
    description: "Risques, comportements et prévention des accidents.",
    quizSlug: "quiz-chapitre-3",
  },
  {
    slug: "chapitre-4",
    step: 4,
    title: "Premiers secours et comportements en cas d'accident",
    subtitle: "Bientôt disponible",
    description: "Gestes de secours et conduite à tenir après un accident.",
    quizSlug: "quiz-chapitre-4",
  },
  {
    slug: "chapitre-5",
    step: 5,
    title: "Conduite économique et technologies modernes",
    subtitle: "Bientôt disponible",
    description: "Éco-conduite et aides à la conduite.",
    quizSlug: "quiz-chapitre-5",
  },
] as const

export const MODULE_SLUGS = [
  "chapitre-1",
  "chapitre-2",
  "chapitre-3",
  "chapitre-4",
  "chapitre-5",
] as const

export type ProgrammeChapitreSlug = (typeof MODULE_SLUGS)[number]

export function getProgrammeSections(
  moduleSlug: string,
): ProgrammeSection[] | null {
  if (moduleSlug === CHAPITRE_1_SLUG) return CHAPITRE_1_SECTIONS
  return null
}

export function findProgrammeLesson(
  moduleSlug: string,
  lessonSlug: string,
): ProgrammeLesson | null {
  const sections = getProgrammeSections(moduleSlug)
  if (!sections) return null
  for (const section of sections) {
    const lesson = section.lessons.find((l) => l.slug === lessonSlug)
    if (lesson) return lesson
  }
  return null
}

export function getProgrammeChapitreMeta(slug: string) {
  return CHAPITRES_PROGRAMME.find((c) => c.slug === slug) ?? null
}
