import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  assertMoniteurCategorieForTenant,
  parseMoniteurCategoriePermisId,
} from "@/lib/api/moniteur"
import { toMoniteurDto } from "@/lib/api/mappers-vehicule"
import { safeMapSync } from "@/lib/api/safe"
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
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      include: { categoriePermis: true },
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
    const body = await request.json()
    const nom = String(body.nom ?? "").trim()
    const prenom = String(body.prenom ?? "").trim()
    const telephone = body.telephone ? String(body.telephone).trim() : null
    const nomAr = String(body.nomAr ?? "").trim() || null
    const prenomAr = String(body.prenomAr ?? "").trim() || null
    const categoriePermisId = await assertMoniteurCategorieForTenant(
      prisma,
      tenant.autoEcoleId,
      parseMoniteurCategoriePermisId(body.categoriePermisId ?? body.categoriePermis),
    )

    if (!nom || !prenom) {
      throw new ApiError(400, "Nom et prénom requis.")
    }

    const moniteur = await prisma.moniteur.create({
      data: {
        autoEcoleId: tenant.autoEcoleId,
        nom,
        prenom,
        nomAr,
        prenomAr,
        categoriePermisId,
        telephone,
        actif: body.actif !== false,
      },
      include: { categoriePermis: true },
    })

    const dto = toMoniteurDto(moniteur)
    if (!dto) throw new ApiError(500, "Erreur lors de la création du moniteur.")
    return jsonWithCors({ moniteur: dto }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
