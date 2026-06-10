import type { LearningChapterImage } from "./types"

/** Extensions autorisées pour les chemins d'images (public/) */
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".svg",
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
] as const

/** Taille max recommandée affichée dans l'admin (Ko) */
export const RECOMMENDED_MAX_IMAGE_KB = 500

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyLessonTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function isValidLessonSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 64 && SLUG_RE.test(slug)
}

export function isValidPublicImagePath(src: string): boolean {
  if (!src.startsWith("/")) return false
  if (src.includes("..")) return false
  if (src.length > 512) return false

  const lower = src.toLowerCase()
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function parseImagesJson(raw: unknown): LearningChapterImage[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const src = String(row.src ?? "").trim()
      const altFr = String(row.altFr ?? "").trim()
      if (!src || !altFr) return null
      if (!isValidPublicImagePath(src)) return null

      return {
        src,
        altFr,
        altKab: row.altKab ? String(row.altKab).trim() : undefined,
        captionFr: row.captionFr ? String(row.captionFr).trim() : undefined,
        captionKab: row.captionKab ? String(row.captionKab).trim() : undefined,
        sortOrder:
          typeof row.sortOrder === "number" ? row.sortOrder : index + 1,
      } satisfies LearningChapterImage
    })
    .filter((item): item is LearningChapterImage => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
