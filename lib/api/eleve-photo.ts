import { createAdminClient } from "@/lib/supabase/admin"

export const ELEVE_PHOTOS_BUCKET = "eleves-photos"
export const ELEVE_PHOTO_MAX_BYTES = 5 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function extensionFromMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null
}

export function buildElevePhotoPath(
  autoEcoleId: string,
  eleveId: string,
  ext: string,
): string {
  return `${autoEcoleId}/${eleveId}/photo.${ext}`
}

export function elevePhotoPublicUrl(
  photoPath: string | null | undefined,
  updatedAt?: Date | null,
): string | null {
  if (!photoPath?.trim()) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  if (!base) return null
  const url = `${base}/storage/v1/object/public/${ELEVE_PHOTOS_BUCKET}/${photoPath}`
  if (updatedAt && !Number.isNaN(updatedAt.getTime())) {
    return `${url}?v=${updatedAt.getTime()}`
  }
  return url
}

export async function removeElevePhotoFromStorage(
  photoPath: string | null | undefined,
): Promise<void> {
  if (!photoPath?.trim()) return
  const admin = createAdminClient()
  await admin.storage.from(ELEVE_PHOTOS_BUCKET).remove([photoPath])
}

export async function uploadElevePhotoToStorage(
  photoPath: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(ELEVE_PHOTOS_BUCKET).upload(photoPath, bytes, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  })
  if (error) {
    throw new Error(error.message || "Échec du téléversement de la photo.")
  }
}
