import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  buildElevePhotoPath,
  ELEVE_PHOTO_MAX_BYTES,
  extensionFromMime,
  removeElevePhotoFromStorage,
  uploadElevePhotoToStorage,
} from "@/lib/api/eleve-photo"
import { toEleveDto } from "@/lib/api/mappers"
import { prisma } from "@/lib/prisma"

const eleveInclude = { categoriePermis: true } as const

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.eleve.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Élève introuvable.")

    const form = await request.formData()
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

    const photoPath = buildElevePhotoPath(tenant.autoEcoleId, id, ext)
    const bytes = Buffer.from(await file.arrayBuffer())

    if (existing.photoPath && existing.photoPath !== photoPath) {
      await removeElevePhotoFromStorage(existing.photoPath)
    }

    await uploadElevePhotoToStorage(photoPath, bytes, file.type)

    const eleve = await prisma.eleve.update({
      where: { id },
      data: { photoPath },
      include: eleveInclude,
    })

    const dto = toEleveDto(eleve)
    if (!dto) throw new ApiError(500, "Données élève invalides.")
    return jsonWithCors({ eleve: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.eleve.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Élève introuvable.")

    if (existing.photoPath) {
      await removeElevePhotoFromStorage(existing.photoPath)
    }

    const eleve = await prisma.eleve.update({
      where: { id },
      data: { photoPath: null },
      include: eleveInclude,
    })

    const dto = toEleveDto(eleve)
    if (!dto) throw new ApiError(500, "Données élève invalides.")
    return jsonWithCors({ eleve: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
