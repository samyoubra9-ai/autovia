import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import {
  buildElevePhotoPath,
  ELEVE_PHOTO_MAX_BYTES,
  extensionFromMime,
  removeElevePhotoFromStorage,
  uploadElevePhotoToStorage,
} from "@/lib/api/eleve-photo"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const { id } = await params
    const existing = await prisma.eleve.findUnique({ where: { id } })
    if (!existing) throw new ApiError(404, "Candidat introuvable.")
    if (existing.statutInscription !== "EN_ATTENTE") {
      throw new ApiError(400, "Cette demande n'accepte plus de photo.")
    }

    const form = await request.formData()
    const ninRaw = String(form.get("nin") ?? "").replace(/\D/g, "")
    if (!ninRaw || ninRaw !== existing.nin) {
      throw new ApiError(403, "Vérification d'identité échouée.")
    }

    const file = form.get("photo")
    if (!(file instanceof File)) {
      throw new ApiError(400, "Fichier photo manquant.")
    }
    if (file.size > ELEVE_PHOTO_MAX_BYTES) {
      throw new ApiError(400, "La photo ne doit pas dépasser 5 Mo.")
    }
    const ext = extensionFromMime(file.type)
    if (!ext) {
      throw new ApiError(400, "Format accepté : JPEG, PNG ou WebP.")
    }

    const photoPath = buildElevePhotoPath(existing.autoEcoleId, id, ext)
    const bytes = Buffer.from(await file.arrayBuffer())

    if (existing.photoPath && existing.photoPath !== photoPath) {
      await removeElevePhotoFromStorage(existing.photoPath)
    }

    await uploadElevePhotoToStorage(photoPath, bytes, file.type)

    await prisma.eleve.update({
      where: { id },
      data: { photoPath },
    })

    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
