import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { generateEleveIdentifiant, requireTenant } from "@/lib/api/auth"
import { generateUniqueCodeSuivi } from "@/lib/api/code-suivi"
import { safeMapSync } from "@/lib/api/safe"
import {
  assertCategoriePermisForTenant,
  resolvePrixPermisEleve,
} from "@/lib/api/categories-permis"
import { assertEleveMoniteurVehiculeForTenant } from "@/lib/api/eleve-relations"
import { parseEleveInput, toEleveDto, toPrismaEleveData } from "@/lib/api/mappers"
import { assertCanAddEleveOnPlan } from "@/lib/plan-limits"
import { assertSetupCanAddEleve } from "@/lib/api/setup-guards"
import { prisma } from "@/lib/prisma"

const eleveInclude = {
  categoriePermis: true,
  moniteur: true,
  vehicule: true,
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const eleves = await prisma.eleve.findMany({
      where: { autoEcoleId: tenant.autoEcoleId },
      orderBy: { createdAt: "desc" },
      include: eleveInclude,
    })
    return jsonWithCors(
      {
        eleves: safeMapSync(eleves, (e) => toEleveDto(e), "eleve"),
      },
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
    const autoEcole = await prisma.autoEcole.findUniqueOrThrow({
      where: { id: tenant.autoEcoleId },
      select: { subscriptionStatus: true },
    })
    const eleveCount = await prisma.eleve.count({
      where: { autoEcoleId: tenant.autoEcoleId },
    })
    assertCanAddEleveOnPlan(autoEcole.subscriptionStatus, eleveCount)
    await assertSetupCanAddEleve(prisma, tenant.autoEcoleId)

    const body = await request.json()
    const input = parseEleveInput(body)

    if (!input.nom || !input.prenom || !input.nin) {
      throw new ApiError(400, "Champs obligatoires manquants.")
    }

    const [ninConflict, telConflict] = await Promise.all([
      prisma.eleve.findFirst({
        where: { autoEcoleId: tenant.autoEcoleId, nin: input.nin },
      }),
      prisma.eleve.findFirst({
        where: { autoEcoleId: tenant.autoEcoleId, telephone: input.telephone },
      }),
    ])
    if (ninConflict) throw new ApiError(409, "Ce N.I.N est déjà enregistré.")
    if (telConflict) throw new ApiError(409, "Ce numéro de téléphone est déjà enregistré.")

    if (input.numeroDossier) {
      const dossierConflict = await prisma.eleve.findFirst({
        where: { autoEcoleId: tenant.autoEcoleId, numeroDossier: input.numeroDossier },
      })
      if (dossierConflict) throw new ApiError(409, "Ce numéro de dossier est déjà utilisé.")
    }

    if (!input.categoriePermisId) {
      throw new ApiError(400, "Catégorie de permis requise.")
    }
    const categorie = await assertCategoriePermisForTenant(
      prisma,
      tenant.autoEcoleId,
      input.categoriePermisId,
    )
    const prixPermis =
      input.prixPermis !== undefined
        ? input.prixPermis
        : resolvePrixPermisEleve(categorie)

    const relations = await assertEleveMoniteurVehiculeForTenant(
      prisma,
      tenant.autoEcoleId,
      input.moniteurId,
      input.vehiculeId,
      { required: true },
    )

    const identifiant = await generateEleveIdentifiant(tenant.autoEcoleId)
    const codeSuivi = await generateUniqueCodeSuivi()
    const eleve = await prisma.eleve.create({
      data: toPrismaEleveData(
        input,
        tenant.autoEcoleId,
        identifiant,
        codeSuivi,
        prixPermis,
        relations,
      ),
      include: eleveInclude,
    })

    const dto = toEleveDto(eleve)
    if (!dto) throw new ApiError(500, "Erreur lors de la création de l'élève.")
    return jsonWithCors({ eleve: dto }, origin, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("invalide")) {
      return handleApiError(new ApiError(400, error.message), origin)
    }
    return handleApiError(error, origin)
  }
}
