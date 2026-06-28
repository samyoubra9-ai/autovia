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
import {
  canReprendreConduiteA1,
  eleveUpdateOnReprendreConduiteA1,
  etapesValideesForStatutA1,
  isA1Eleve,
} from "@/lib/api/permis-a1"
import { removeElevePhotoFromStorage } from "@/lib/api/eleve-photo"
import {
  assertCategoriePermisForTenant,
  resolvePrixPermisEleve,
} from "@/lib/api/categories-permis"
import { assertEleveMoniteurVehiculeForTenant } from "@/lib/api/eleve-relations"
import {
  eleveRelationsUpdateData,
  GROUPE_FROM_CLIENT,
  parseEleveInput,
  permisObtenuDataFromInput,
  toEleveDto,
} from "@/lib/api/mappers"
import { notifyBackdashParcoursStep } from "@/lib/push/backdash-events"
import { notifyCandidatParcoursStep } from "@/lib/push/candidat-events"
import { prisma } from "@/lib/prisma"

const ETAPE_PUSH_LABELS: Record<EtapeParcours, string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
}

const eleveInclude = {
  categoriePermis: true,
  moniteur: true,
  vehicule: true,
} as const

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

    if (body.reprendreConduiteA1 === true) {
      if (!isA1Eleve(existing)) {
        throw new ApiError(400, "Action réservée aux candidats permis A1.")
      }
      if (!canReprendreConduiteA1(existing)) {
        throw new ApiError(
          400,
          "Reprise conduite A1 : code obtenu et 18 ans révolus requis.",
        )
      }
      const eleve = await prisma.eleve.update({
        where: { id },
        data: eleveUpdateOnReprendreConduiteA1(),
        include: eleveInclude,
      })
      const dto = toEleveDto(eleve)
      if (!dto) throw new ApiError(500, "Données élève invalides.")
      return jsonWithCors({ eleve: dto }, origin)
    }

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
          statutFormation: statutAfterValidateEtape(
            etape,
            existing.statutFormation,
            existing,
          ),
        },
        include: eleveInclude,
      })
      const dto = toEleveDto(eleve)
      if (!dto) throw new ApiError(500, "Données élève invalides.")

      notifyCandidatParcoursStep({
        eleveId: id,
        stepLabel: ETAPE_PUSH_LABELS[etape],
      })
      notifyBackdashParcoursStep({
        autoEcoleId: tenant.autoEcoleId,
        eleveId: id,
        stepLabel: ETAPE_PUSH_LABELS[etape],
      })

      return jsonWithCors({ eleve: dto }, origin)
    }

    if (body && typeof body === "object") {
      const patchBody = body as Record<string, unknown>
      const sp = String(patchBody.situationProfessionnelle ?? "").trim()
      if (!sp) {
        patchBody.situationProfessionnelle =
          existing.situationProfessionnelle?.trim() || "etudiant"
      }
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
    const prixPermis =
      input.prixPermis !== undefined
        ? input.prixPermis
        : resolvePrixPermisEleve(categorie, existing, input.categoriePermisId)
    await assertNoDuplicates(tenant.autoEcoleId, input.nin, input.telephone, id)

    const impliedEtapes = isA1Eleve({ categoriePermis: categorie })
      ? etapesValideesForStatutA1(input.statutFormation)
      : etapesValideesForStatut(input.statutFormation)
    assertStatutFormationAllowed(
      {
        etapeCodeValidee: existing.etapeCodeValidee || impliedEtapes.etapeCodeValidee,
        etapeCreneauValidee:
          existing.etapeCreneauValidee || impliedEtapes.etapeCreneauValidee,
        etapeCirculationValidee:
          existing.etapeCirculationValidee || impliedEtapes.etapeCirculationValidee,
        statutFormation: existing.statutFormation,
        categoriePermis: categorie,
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

    const relations = await assertEleveMoniteurVehiculeForTenant(
      prisma,
      tenant.autoEcoleId,
      body.moniteurId !== undefined ? input.moniteurId : existing.moniteurId,
      body.vehiculeId !== undefined ? input.vehiculeId : existing.vehiculeId,
    )

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
        domicile: input.domicile,
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
        dateDepotDwsr: input.dateDepotDwsr ? new Date(input.dateDepotDwsr) : null,
        nomAr: input.nomAr ?? null,
        prenomAr: input.prenomAr ?? null,
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
        ...permisObtenuDataFromInput(input),
        ...eleveRelationsUpdateData(relations),
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
