import { prisma } from "@/lib/prisma"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import { parseImagesJson } from "./validation"
import type { AdminModuleRow, LessonContentDto } from "./types"

function pickLocaleText(
  locale: VitrineLocale,
  fr: string | null | undefined,
  kab: string | null | undefined,
): string | null {
  if (locale === "kab" && kab?.trim()) return kab.trim()
  return fr?.trim() ?? null
}

export async function getLessonContentFromDb(
  moduleSlug: string,
  chapterSlug: string,
  locale: VitrineLocale = "fr",
): Promise<LessonContentDto | null> {
  try {
    const chapter = await prisma.learningChapter.findFirst({
      where: {
        slug: chapterSlug,
        published: true,
        module: { slug: moduleSlug, published: true },
      },
    })

    if (!chapter) return null

    const images = parseImagesJson(chapter.imagesJson).map((img) => ({
      ...img,
      altFr: pickLocaleText(locale, img.altFr, img.altKab) ?? img.altFr,
      captionFr:
        pickLocaleText(locale, img.captionFr, img.captionKab) ?? img.captionFr,
    }))

    return {
      title:
        pickLocaleText(locale, chapter.titleFr, chapter.titleKab) ??
        chapter.titleFr,
      summary:
        pickLocaleText(locale, chapter.summaryFr, chapter.summaryKab) ?? "",
      body: pickLocaleText(locale, chapter.bodyFr, chapter.bodyKab),
      images,
      published: chapter.published,
    }
  } catch {
    return null
  }
}

export async function listLearningModulesForAdmin(): Promise<AdminModuleRow[]> {
  const modules = await prisma.learningModule.findMany({
    orderBy: { step: "asc" },
    include: {
      chapters: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return modules.map((mod) => ({
    id: mod.id,
    slug: mod.slug,
    step: mod.step,
    titleFr: mod.titleFr,
    subtitleFr: mod.subtitleFr,
    descriptionFr: mod.descriptionFr,
    published: mod.published,
    chapters: mod.chapters.map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      sortOrder: ch.sortOrder,
      titleFr: ch.titleFr,
      summaryFr: ch.summaryFr,
      published: ch.published,
      updatedAt: ch.updatedAt,
    })),
  }))
}

export async function getLearningModuleForAdmin(slug: string) {
  return prisma.learningModule.findUnique({
    where: { slug },
    include: {
      chapters: { orderBy: { sortOrder: "asc" } },
    },
  })
}

export async function getLearningChapterForAdmin(
  moduleSlug: string,
  chapterSlug: string,
) {
  return prisma.learningChapter.findFirst({
    where: {
      slug: chapterSlug,
      module: { slug: moduleSlug },
    },
    include: { module: true },
  })
}
