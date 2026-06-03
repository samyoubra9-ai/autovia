import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  assertCategoriesPermisForMoniteur,
  assertUniqueMoniteurPrincipal,
  moniteurCategoriesInclude,
  parseCategoriesPermisIds,
  parseEstPrincipal,
  parseOptionalMoniteurDateFinContrat,
  parseOptionalNumeroCarteMoniteur,
  syncMoniteurCategories,
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
      include: moniteurCategoriesInclude,
    })
    if (!existing) throw new ApiError(404, "Moniteur introuvable.")

    const body = (await request.json()) as Record<string, unknown>
    const nom = body.nom !== undefined ? String(body.nom).trim() : existing.nom
    const prenom = body.prenom !== undefined ? String(body.prenom).trim() : existing.prenom

    if (!nom || !prenom) throw new ApiError(400, "Nom et prénom requis.")

    const estPrincipal =
      body.estPrincipal !== undefined
        ? parseEstPrincipal(body.estPrincipal)
        : existing.estPrincipal

    const parsedIds = parseCategoriesPermisIds(body)
    const currentIds =
      existing.categoriesEnseignees?.map((r) => r.categoriePermisId) ??
      (existing.categoriePermisId ? [existing.categoriePermisId] : [])
    const categoriePermisIds =
      parsedIds !== undefined
        ? await assertCategoriesPermisForMoniteur(
            prisma,
            tenant.autoEcoleId,
            parsedIds,
            estPrincipal,
          )
        : currentIds

    const moniteur = await prisma.$transaction(async (tx) => {
      await assertUniqueMoniteurPrincipal(tx, tenant.autoEcoleId, id, estPrincipal)
      await tx.moniteur.update({
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
          estPrincipal,
          categoriePermisId: categoriePermisIds[0] ?? null,
          telephone:
            body.telephone !== undefined
              ? body.telephone
                ? String(body.telephone).trim()
                : null
              : existing.telephone,
          actif: body.actif !== undefined ? Boolean(body.actif) : existing.actif,
          numeroCarteMoniteur:
            body.numeroCarteMoniteur !== undefined
              ? parseOptionalNumeroCarteMoniteur(body.numeroCarteMoniteur)
              : existing.numeroCarteMoniteur,
          dateFinContrat:
            body.dateFinContrat !== undefined
              ? parseOptionalMoniteurDateFinContrat(body.dateFinContrat)
              : existing.dateFinContrat,
        },
      })
      if (parsedIds !== undefined) {
        await syncMoniteurCategories(tx, id, categoriePermisIds)
      }
      return tx.moniteur.findUniqueOrThrow({
        where: { id },
        include: moniteurCategoriesInclude,
      })
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
