import chapitre1 from "@/content/apprentissage/chapitre-1.json"
import type { ProgrammeChapitreJson, ProgrammeLesson } from "@/lib/apprentissage/programme/types"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"
import { parseImagesJson } from "@/lib/learning/validation"
import type { LessonContentDto } from "@/lib/learning/types"

const CHAPTERS_BY_SLUG: Record<string, ProgrammeChapitreJson> = {
  "chapitre-1": chapitre1 as ProgrammeChapitreJson,
}

function pickLocaleText(
  locale: VitrineLocale,
  fr: string | null | undefined,
  kab: string | null | undefined,
): string | null {
  if (locale === "kab" && kab?.trim()) return kab.trim()
  return fr?.trim() ?? null
}

export function getChapitreJson(moduleSlug: string): ProgrammeChapitreJson | null {
  return CHAPTERS_BY_SLUG[moduleSlug] ?? null
}

export function findLessonInJson(
  moduleSlug: string,
  lessonSlug: string,
): ProgrammeLesson | null {
  const chapitre = getChapitreJson(moduleSlug)
  if (!chapitre) return null
  for (const section of chapitre.sections) {
    const lesson = section.lessons.find((l) => l.slug === lessonSlug)
    if (lesson) return lesson
  }
  return null
}

export function getLessonContentFromJson(
  moduleSlug: string,
  lessonSlug: string,
  locale: VitrineLocale = "fr",
): LessonContentDto | null {
  const lesson = findLessonInJson(moduleSlug, lessonSlug)
  if (!lesson || lesson.published === false) return null

  const images = parseImagesJson(lesson.images ?? []).map((img) => ({
    ...img,
    altFr: pickLocaleText(locale, img.altFr, img.altKab) ?? img.altFr,
    captionFr:
      pickLocaleText(locale, img.captionFr, img.captionKab) ?? img.captionFr,
  }))

  return {
    title: lesson.title,
    summary: lesson.summary,
    body: pickLocaleText(locale, lesson.body, lesson.bodyKab),
    images,
    published: true,
  }
}
