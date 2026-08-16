"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireSiteAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import {
  isValidLessonSlug,
  isValidPublicImagePath,
  parseImagesJson,
  slugifyLessonTitle,
} from "@/lib/learning/validation"
import type { LearningChapterImage } from "@/lib/learning/types"

export type LearningActionResult = { error?: string; success?: string }

function revalidateLearningAdmin(moduleSlug: string) {
  revalidatePath("/admin/apprentissage")
  revalidatePath(`/admin/apprentissage/${moduleSlug}`)
  revalidatePath(`/apprendre/${moduleSlug}`)
}

function revalidateChapterPaths(moduleSlug: string, chapterSlug: string) {
  revalidateLearningAdmin(moduleSlug)
  revalidatePath(`/admin/apprentissage/${moduleSlug}/chapters/${chapterSlug}`)
  revalidatePath(`/apprendre/${moduleSlug}/${chapterSlug}`)
}

function parseImagesFromForm(formData: FormData): LearningChapterImage[] {
  const raw = String(formData.get("imagesJson") ?? "[]")
  try {
    return parseImagesJson(JSON.parse(raw))
  } catch {
    return []
  }
}

function readChapterFields(formData: FormData) {
  return {
    titleFr: String(formData.get("titleFr") ?? "").trim(),
    titleKab: String(formData.get("titleKab") ?? "").trim() || null,
    summaryFr: String(formData.get("summaryFr") ?? "").trim() || null,
    summaryKab: String(formData.get("summaryKab") ?? "").trim() || null,
    bodyFr: String(formData.get("bodyFr") ?? "").trim() || null,
    bodyKab: String(formData.get("bodyKab") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 1),
    published: formData.get("published") === "on",
    images: parseImagesFromForm(formData),
  }
}

export async function createLearningChapter(
  moduleSlug: string,
  formData: FormData,
): Promise<LearningActionResult> {
  await requireSiteAdmin()

  const mod = await prisma.learningModule.findUnique({ where: { slug: moduleSlug } })
  if (!mod) return { error: "Module introuvable." }

  const slugInput = String(formData.get("slug") ?? "").trim()
  const slug = slugInput || slugifyLessonTitle(String(formData.get("titleFr") ?? ""))
  if (!isValidLessonSlug(slug)) {
    return { error: "Slug invalide (minuscules, chiffres et tirets uniquement)." }
  }

  const existing = await prisma.learningChapter.findUnique({
    where: { moduleId_slug: { moduleId: mod.id, slug } },
  })
  if (existing) return { error: "Une leçon avec ce slug existe déjà dans ce module." }

  const fields = readChapterFields(formData)
  if (!fields.titleFr) return { error: "Le titre français est obligatoire." }

  for (const img of fields.images) {
    if (!isValidPublicImagePath(img.src)) {
      return { error: `Chemin d'image invalide : ${img.src}` }
    }
  }

  await prisma.learningChapter.create({
    data: {
      moduleId: mod.id,
      slug,
      sortOrder: Number.isFinite(fields.sortOrder) ? fields.sortOrder : 1,
      titleFr: fields.titleFr,
      titleKab: fields.titleKab,
      summaryFr: fields.summaryFr,
      summaryKab: fields.summaryKab,
      bodyFr: fields.bodyFr,
      bodyKab: fields.bodyKab,
      imagesJson: fields.images,
      published: fields.published,
    },
  })

  revalidateChapterPaths(moduleSlug, slug)
  redirect(`/admin/apprentissage/${moduleSlug}/chapters/${slug}?saved=1`)
}

export async function updateLearningChapter(
  moduleSlug: string,
  chapterSlug: string,
  formData: FormData,
): Promise<LearningActionResult> {
  await requireSiteAdmin()

  const chapter = await prisma.learningChapter.findFirst({
    where: { slug: chapterSlug, module: { slug: moduleSlug } },
  })
  if (!chapter) return { error: "Leçon introuvable." }

  const fields = readChapterFields(formData)
  if (!fields.titleFr) return { error: "Le titre français est obligatoire." }

  for (const img of fields.images) {
    if (!isValidPublicImagePath(img.src)) {
      return { error: `Chemin d'image invalide : ${img.src}` }
    }
  }

  await prisma.learningChapter.update({
    where: { id: chapter.id },
    data: {
      sortOrder: Number.isFinite(fields.sortOrder) ? fields.sortOrder : chapter.sortOrder,
      titleFr: fields.titleFr,
      titleKab: fields.titleKab,
      summaryFr: fields.summaryFr,
      summaryKab: fields.summaryKab,
      bodyFr: fields.bodyFr,
      bodyKab: fields.bodyKab,
      imagesJson: fields.images,
      published: fields.published,
    },
  })

  revalidateChapterPaths(moduleSlug, chapterSlug)
  return { success: "Leçon enregistrée." }
}

export async function deleteLearningChapter(
  moduleSlug: string,
  chapterId: string,
): Promise<LearningActionResult> {
  await requireSiteAdmin()

  const chapter = await prisma.learningChapter.findFirst({
    where: { id: chapterId, module: { slug: moduleSlug } },
  })
  if (!chapter) return { error: "Leçon introuvable." }

  await prisma.learningChapter.delete({ where: { id: chapter.id } })
  revalidateLearningAdmin(moduleSlug)
  redirect(`/admin/apprentissage/${moduleSlug}`)
}

export async function createLearningModule(
  formData: FormData,
): Promise<LearningActionResult> {
  await requireSiteAdmin()

  const slugInput = String(formData.get("slug") ?? "").trim()
  const slug = slugInput || slugifyLessonTitle(String(formData.get("titleFr") ?? ""))
  if (!isValidLessonSlug(slug)) {
    return { error: "Slug invalide (minuscules, chiffres et tirets uniquement)." }
  }

  const titleFr = String(formData.get("titleFr") ?? "").trim()
  if (!titleFr) return { error: "Le titre français est obligatoire." }

  const step = Number(formData.get("step") ?? 1)
  if (!Number.isFinite(step) || step < 1) {
    return { error: "L'étape doit être un nombre ≥ 1." }
  }

  const unlockAfterSlug =
    String(formData.get("unlockAfterSlug") ?? "").trim() || null

  if (unlockAfterSlug) {
    const prev = await prisma.learningModule.findUnique({
      where: { slug: unlockAfterSlug },
    })
    if (!prev) return { error: "Module précédent introuvable." }
  }

  const existing = await prisma.learningModule.findUnique({ where: { slug } })
  if (existing) return { error: "Un module avec ce slug existe déjà." }

  await prisma.learningModule.create({
    data: {
      slug,
      step,
      titleFr,
      titleKab: String(formData.get("titleKab") ?? "").trim() || null,
      subtitleFr: String(formData.get("subtitleFr") ?? "").trim() || null,
      subtitleKab: String(formData.get("subtitleKab") ?? "").trim() || null,
      descriptionFr: String(formData.get("descriptionFr") ?? "").trim() || null,
      descriptionKab: String(formData.get("descriptionKab") ?? "").trim() || null,
      unlockAfterSlug,
      published: formData.get("published") === "on",
    },
  })

  revalidatePath("/admin/apprentissage")
  redirect(`/admin/apprentissage/${slug}?saved=1`)
}

export async function updateLearningModule(
  moduleSlug: string,
  formData: FormData,
): Promise<LearningActionResult> {
  await requireSiteAdmin()

  const titleFr = String(formData.get("titleFr") ?? "").trim()
  if (!titleFr) return { error: "Le titre français est obligatoire." }

  await prisma.learningModule.update({
    where: { slug: moduleSlug },
    data: {
      titleFr,
      titleKab: String(formData.get("titleKab") ?? "").trim() || null,
      subtitleFr: String(formData.get("subtitleFr") ?? "").trim() || null,
      subtitleKab: String(formData.get("subtitleKab") ?? "").trim() || null,
      descriptionFr: String(formData.get("descriptionFr") ?? "").trim() || null,
      descriptionKab: String(formData.get("descriptionKab") ?? "").trim() || null,
      published: formData.get("published") === "on",
    },
  })

  revalidateLearningAdmin(moduleSlug)
  return { success: "Module enregistré." }
}
