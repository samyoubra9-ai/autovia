import { createAdminClient } from "@/lib/supabase/admin"

import { VERIFICATION_BUCKET } from "./constants"

export async function uploadVerificationDocument(
  storagePath: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(VERIFICATION_BUCKET).upload(storagePath, bytes, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  })
  if (error) {
    throw new Error(error.message || "Échec du téléversement du document.")
  }
}

export async function removeVerificationPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const admin = createAdminClient()
  await admin.storage.from(VERIFICATION_BUCKET).remove(paths)
}

export async function downloadVerificationDocument(
  storagePath: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(VERIFICATION_BUCKET).download(storagePath)
  if (error || !data) {
    throw new Error(error?.message || "Document introuvable.")
  }
  const bytes = Buffer.from(await data.arrayBuffer())
  return { bytes, contentType: data.type || "application/octet-stream" }
}

export async function createVerificationSignedUrl(
  storagePath: string,
  expiresInSeconds = 600,
): Promise<string> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Impossible de générer le lien de téléchargement.")
  }
  return data.signedUrl
}
