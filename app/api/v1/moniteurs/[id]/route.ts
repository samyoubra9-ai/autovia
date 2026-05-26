import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  assertMoniteurCategorieForTenant,
  parseMoniteurCategoriePermisId,
} from "@/lib/api/moniteur"
import { toMoniteurDto } from "@/lib/api/mappers-vehicule"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.moniteur.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Moniteur introuvable.")

    const body = await request.json()
    const nom = body.nom !== undefined ? String(body.nom).trim() : existing.nom
    const prenom = body.prenom !== undefined ? String(body.prenom).trim() : existing.prenom

    if (!nom || !prenom) throw new ApiError(400, "Nom et prénom requis.")

    let categoriePermisId = existing.categoriePermisId
    if (body.categoriePermisId !== undefined || body.categoriePermis !== undefined) {
      categoriePermisId = await assertMoniteurCategorieForTenant(
        prisma,
        tenant.autoEcoleId,
        parseMoniteurCategoriePermisId(body.categoriePermisId ?? body.categoriePermis),
      )
    }

    const moniteur = await prisma.moniteur.update({
      where: { id },
      data: {
        nom,
        prenom,
        nomAr:
          body.nomAr !== undefined
            ? String(body.nomAr).trim() || null
            : existing.nomAr,
        prenomAr:
          body.prenomAr !== undefined
            ? String(body.prenomAr).trim() || null
            : existing.prenomAr,
        categoriePermisId,
        telephone:
          body.telephone !== undefined
            ? body.telephone
              ? String(body.telephone).trim()
              : null
            : existing.telephone,
        actif: body.actif !== undefined ? Boolean(body.actif) : existing.actif,
      },
      include: { categoriePermis: true },
    })

    const dto = toMoniteurDto(moniteur)
    if (!dto) throw new ApiError(500, "Données moniteur invalides.")
    return jsonWithCors({ moniteur: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.moniteur.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Moniteur introuvable.")

    await prisma.moniteur.delete({ where: { id } })
    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
