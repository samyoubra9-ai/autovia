import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  assertCanValidateEtape,
  assertStatutFormationAllowed,
  etapeToPrismaField,
  statutAfterValidateEtape,
  type EtapeParcours,
} from "@/lib/api/formation"
import { etapesValideesForStatut } from "@/lib/api/formation-sync"
import { removeElevePhotoFromStorage } from "@/lib/api/eleve-photo"
import {
  assertCategoriePermisForTenant,
  resolvePrixPermisEleve,
} from "@/lib/api/categories-permis"
import {
  GROUPE_FROM_CLIENT,
  parseEleveInput,
  permisObtenuDataFromInput,
  toEleveDto,
} from "@/lib/api/mappers"
import { prisma } from "@/lib/prisma"

const eleveInclude = { categoriePermis: true } as const

type Params = { params: Promise<{ id: string }> }

async function assertNoDuplicates(
  autoEcoleId: string,
  nin: string,
  telephone: string,
  excludeId: string,
) {
  const ninConflict = await prisma.eleve.findFirst({
    where: { autoEcoleId, nin, id: { not: excludeId } },
  })
  if (ninConflict) {
    throw new ApiError(409, "Ce N.I.N est déjà enregistré pour un autre candidat.")
  }
  const telConflict = await prisma.eleve.findFirst({
    where: { autoEcoleId, telephone, id: { not: excludeId } },
  })
  if (telConflict) {
    throw new ApiError(409, "Ce numéro de téléphone est déjà enregistré.")
  }
}

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.eleve.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
      include: eleveInclude,
    })
    if (!existing) throw new ApiError(404, "Élève introuvable.")

    const body = await request.json()

    if (body.validateEtape) {
      const etape = String(body.validateEtape) as EtapeParcours
      if (!["code", "creneau", "circulation"].includes(etape)) {
        throw new ApiError(400, "Étape invalide.")
      }
      assertCanValidateEtape(existing, etape)
      const field = etapeToPrismaField(etape)
      const eleve = await prisma.eleve.update({
        where: { id },
        data: {
          [field]: true,
          statutFormation: statutAfterValidateEtape(etape, existing.statutFormation),
        },
        include: eleveInclude,
      })
      const dto = toEleveDto(eleve)
      if (!dto) throw new ApiError(500, "Données élève invalides.")
      return jsonWithCors({ eleve: dto }, origin)
    }

    const input = parseEleveInput(body)
    if (!input.categoriePermisId) {
      throw new ApiError(400, "Catégorie de permis requise.")
    }
    const categorie = await assertCategoriePermisForTenant(
      prisma,
      tenant.autoEcoleId,
      input.categoriePermisId,
    )
    const prixPermis = resolvePrixPermisEleve(categorie, existing, input.categoriePermisId)
    await assertNoDuplicates(tenant.autoEcoleId, input.nin, input.telephone, id)

    const impliedEtapes = etapesValideesForStatut(input.statutFormation)
    assertStatutFormationAllowed(
      {
        etapeCodeValidee: existing.etapeCodeValidee || impliedEtapes.etapeCodeValidee,
        etapeCreneauValidee:
          existing.etapeCreneauValidee || impliedEtapes.etapeCreneauValidee,
        etapeCirculationValidee:
          existing.etapeCirculationValidee || impliedEtapes.etapeCirculationValidee,
      },
      input.statutFormation,
    )

    if (input.numeroDossier) {
      const dossierConflict = await prisma.eleve.findFirst({
        where: {
          autoEcoleId: tenant.autoEcoleId,
          numeroDossier: input.numeroDossier,
          id: { not: id },
        },
      })
      if (dossierConflict) {
        throw new ApiError(409, "Ce numéro de dossier est déjà utilisé.")
      }
    }

    const groupeSanguin =
      GROUPE_FROM_CLIENT[input.groupeSanguin] ?? existing.groupeSanguin

    const eleve = await prisma.eleve.update({
      where: { id },
      data: {
        etapeCodeValidee: existing.etapeCodeValidee || impliedEtapes.etapeCodeValidee,
        etapeCreneauValidee:
          existing.etapeCreneauValidee || impliedEtapes.etapeCreneauValidee,
        etapeCirculationValidee:
          existing.etapeCirculationValidee || impliedEtapes.etapeCirculationValidee,
        telephone: input.telephone,
        nom: input.nom,
        prenom: input.prenom,
        nin: input.nin,
        dateNaissance: new Date(input.dateNaissance),
        lieuNaissance: input.lieuNaissance,
        sexe: input.sexe,
        groupeSanguin,
        categoriePermis: { connect: { id: input.categoriePermisId } },
        statutFormation: input.statutFormation,
        mairieEnregistrement: input.mairieEnregistrement,
        nationalite: input.nationalite,
        prenomPere: input.prenomPere,
        nomMere: input.nomMere,
        prenomMere: input.prenomMere,
        nomJeuneFille: input.sexe === "feminin" ? input.nomJeuneFille ?? null : null,
        situationFamiliale: input.situationFamiliale,
        situationProfessionnelle: input.situationProfessionnelle,
        prixPermis,
        numeroDossier: input.numeroDossier ?? null,
        nomAr: input.nomAr ?? null,
        prenomAr: input.prenomAr ?? null,
        ...permisObtenuDataFromInput(input),
      },
      include: eleveInclude,
    })

    const dto = toEleveDto(eleve)
    if (!dto) throw new ApiError(500, "Données élève invalides.")
    return jsonWithCors({ eleve: dto }, origin)
  } catch (error) {
    if (error instanceof Error && error.message.includes("invalide")) {
      return handleApiError(new ApiError(400, error.message), origin)
    }
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
      await removeElevePhotoFromStorage(existing.photoPath).catch(() => undefined)
    }

    await prisma.eleve.delete({ where: { id } })
    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
