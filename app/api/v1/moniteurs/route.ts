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
import { safeMapSync } from "@/lib/api/safe"
import { assertCanAddMoniteurOnPlan } from "@/lib/api/trial-plan-context"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const moniteurs = await prisma.moniteur.findMany({
      where: { autoEcoleId: tenant.autoEcoleId },
      orderBy: [{ estPrincipal: "desc" }, { nom: "asc" }, { prenom: "asc" }],
      include: moniteurCategoriesInclude,
    })
    return jsonWithCors(
      { moniteurs: safeMapSync(moniteurs, (m) => toMoniteurDto(m), "moniteur") },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = (await request.json()) as Record<string, unknown>
    const nom = String(body.nom ?? "").trim()
    const prenom = String(body.prenom ?? "").trim()
    const telephone = body.telephone ? String(body.telephone).trim() : null
    const nomAr = String(body.nomAr ?? "").trim() || null
    const prenomAr = String(body.prenomAr ?? "").trim() || null
    const estPrincipal = parseEstPrincipal(body.estPrincipal)

    if (!nom || !prenom) {
      throw new ApiError(400, "Nom et prénom requis.")
    }

    const autoEcole = await prisma.autoEcole.findUniqueOrThrow({
      where: { id: tenant.autoEcoleId },
      select: { subscriptionStatus: true },
    })
    await assertCanAddMoniteurOnPlan(
      prisma,
      tenant.autoEcoleId,
      autoEcole.subscriptionStatus,
    )

    const parsedIds = parseCategoriesPermisIds(body)
    if (!parsedIds?.length) {
      throw new ApiError(400, "Au moins une catégorie enseignée est requise.")
    }
    const categoriePermisIds = await assertCategoriesPermisForMoniteur(
      prisma,
      tenant.autoEcoleId,
      parsedIds,
      estPrincipal,
    )

    const moniteur = await prisma.$transaction(async (tx) => {
      const created = await tx.moniteur.create({
        data: {
          autoEcoleId: tenant.autoEcoleId,
          nom,
          prenom,
          nomAr,
          prenomAr,
          estPrincipal,
          categoriePermisId: categoriePermisIds[0] ?? null,
          telephone,
          numeroCarteMoniteur: parseOptionalNumeroCarteMoniteur(body.numeroCarteMoniteur),
          dateFinContrat: parseOptionalMoniteurDateFinContrat(body.dateFinContrat),
          actif: body.actif !== false,
        },
      })
      await assertUniqueMoniteurPrincipal(
        tx,
        tenant.autoEcoleId,
        created.id,
        estPrincipal,
      )
      await syncMoniteurCategories(tx, created.id, categoriePermisIds)
      return tx.moniteur.findUniqueOrThrow({
        where: { id: created.id },
        include: moniteurCategoriesInclude,
      })
    })

    const dto = toMoniteurDto(moniteur)
    if (!dto) throw new ApiError(500, "Erreur lors de la création du moniteur.")
    return jsonWithCors({ moniteur: dto }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
