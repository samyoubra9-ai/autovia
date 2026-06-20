import { ApiError } from "@/lib/api/errors"
import { generateUniqueCodeSuivi } from "@/lib/api/code-suivi"
import { generateEleveIdentifiant } from "@/lib/api/auth"
import {
  assertCategoriePermisForTenant,
  resolvePrixPermisEleve,
} from "@/lib/api/categories-permis"
import { assertEleveMoniteurVehiculeForTenant } from "@/lib/api/eleve-relations"
import { generatePendingEleveIdentifiant } from "@/lib/api/inscription-identifiant"
import { parseEleveInput, toPrismaEleveData } from "@/lib/api/mappers"
import { assertPublicAutoEcoleForInscription } from "@/lib/api/public-auto-ecoles"
import {
  assertOnlineInscriptionForAutoEcole,
  hasOnlineInscriptionFeature,
} from "@/lib/plan-features"
import { prisma } from "@/lib/prisma"

export type PublicInscriptionResult = {
  id: string
  autoEcoleNom: string
  prenom: string
  nom: string
}

export async function createPublicPreInscription(
  body: unknown,
): Promise<PublicInscriptionResult> {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Corps de requête invalide.")
  }
  const raw = body as Record<string, unknown>

  if (raw._honeypot && String(raw._honeypot).trim()) {
    throw new ApiError(400, "Requête invalide.")
  }

  const autoEcoleId = String(raw.autoEcoleId ?? "").trim()
  if (!autoEcoleId) {
    throw new ApiError(400, "Choisissez une auto-école.")
  }

  let autoEcole
  try {
    autoEcole = await assertPublicAutoEcoleForInscription(autoEcoleId)
  } catch {
    throw new ApiError(
      400,
      "Cette auto-école n'accepte pas les inscriptions en ligne pour le moment.",
      "AUTO_ECOLE_UNAVAILABLE",
    )
  }

  const aeRow = await prisma.autoEcole.findUnique({
    where: { id: autoEcoleId },
    select: { subscriptionStatus: true, subscriptionPlan: true },
  })
  if (
    !aeRow ||
    !hasOnlineInscriptionFeature(aeRow.subscriptionStatus, aeRow.subscriptionPlan)
  ) {
    throw new ApiError(
      403,
      "Les inscriptions en ligne sont disponibles avec les packs Essentiel Connect ou Pro.",
      "ONLINE_INSCRIPTION_PLAN_REQUIRED",
    )
  }

  const input = parseEleveInput({
    ...raw,
    statutFormation: "code",
    moniteurId: null,
    vehiculeId: null,
  })

  if (!input.nom || !input.prenom || !input.nin || !input.domicile) {
    throw new ApiError(400, "Champs obligatoires manquants.")
  }
  if (!input.nomAr?.trim() || !input.prenomAr?.trim()) {
    throw new ApiError(400, "Le nom et le prénom en arabe sont requis.")
  }
  if (!input.mairieEnregistrement?.trim()) {
    throw new ApiError(400, "La mairie d'enregistrement est requise.")
  }
  if (input.permisDejaObtenu) {
    if (!input.numeroPermisObtenu?.trim()) {
      throw new ApiError(400, "Le numéro de permis est requis.")
    }
    if (!input.datePermisObtenu?.trim()) {
      throw new ApiError(400, "La date d'obtention du permis est requise.")
    }
    if (!input.permisDelivrePar?.trim()) {
      throw new ApiError(400, "Indiquez la mairie ou l'autorité de délivrance.")
    }
    if (!input.categoriesPermisObtenues?.length) {
      throw new ApiError(400, "Sélectionnez au moins une catégorie obtenue.")
    }
  }

  const categorie = await assertCategoriePermisForTenant(
    prisma,
    autoEcoleId,
    input.categoriePermisId,
  )
  const prixPermis = resolvePrixPermisEleve(categorie)

  const [ninConflict, telConflict] = await Promise.all([
    prisma.eleve.findFirst({
      where: {
        autoEcoleId,
        nin: input.nin,
        statutInscription: { in: ["EN_ATTENTE", "VALIDE"] },
      },
    }),
    prisma.eleve.findFirst({
      where: {
        autoEcoleId,
        telephone: input.telephone,
        statutInscription: { in: ["EN_ATTENTE", "VALIDE"] },
      },
    }),
  ])
  if (ninConflict) {
    throw new ApiError(
      409,
      "Ce N.I.N est déjà enregistré auprès de cette auto-école.",
      "NIN_CONFLICT",
    )
  }
  if (telConflict) {
    throw new ApiError(
      409,
      "Ce numéro de téléphone est déjà enregistré auprès de cette auto-école.",
      "PHONE_CONFLICT",
    )
  }

  const identifiant = await generatePendingEleveIdentifiant(prisma, autoEcoleId)

  const eleve = await prisma.eleve.create({
    data: toPrismaEleveData(input, autoEcoleId, identifiant, {
      codeSuivi: null,
      prixPermis,
      statutInscription: "EN_ATTENTE",
    }),
    select: { id: true, prenom: true, nom: true },
  })

  return {
    id: eleve.id,
    autoEcoleNom: autoEcole.nom,
    prenom: eleve.prenom,
    nom: eleve.nom,
  }
}

export async function validateEleveInscription(
  autoEcoleId: string,
  eleveId: string,
  opts?: { moniteurId?: string | null; vehiculeId?: string | null },
) {
  await assertOnlineInscriptionForAutoEcole(prisma, autoEcoleId)

  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, autoEcoleId },
  })
  if (!eleve) throw new ApiError(404, "Candidat introuvable.")
  if (eleve.statutInscription !== "EN_ATTENTE") {
    throw new ApiError(400, "Cette demande n'est pas en attente de validation.")
  }

  const { loadEleveQuotaInput } = await import("@/lib/api/eleve-quota-context")
  const { assertCanAddEleveOnPlan } = await import("@/lib/plan-limits")
  const quotaInput = await loadEleveQuotaInput(prisma, autoEcoleId)
  assertCanAddEleveOnPlan(quotaInput)

  const relations = await assertEleveMoniteurVehiculeForTenant(
    prisma,
    autoEcoleId,
    opts?.moniteurId ?? null,
    opts?.vehiculeId ?? null,
    { required: false },
  )

  const identifiant = await generateEleveIdentifiant(autoEcoleId)
  const codeSuivi = await generateUniqueCodeSuivi()

  return prisma.eleve.update({
    where: { id: eleveId },
    data: {
      identifiant,
      codeSuivi,
      statutInscription: "VALIDE",
      inscriptionValidatedAt: new Date(),
      inscriptionRefusedReason: null,
      ...(relations.moniteurId
        ? { moniteur: { connect: { id: relations.moniteurId } } }
        : {}),
      ...(relations.vehiculeId
        ? { vehicule: { connect: { id: relations.vehiculeId } } }
        : {}),
    },
  })
}

export async function refuseEleveInscription(
  autoEcoleId: string,
  eleveId: string,
  reason?: string | null,
) {
  await assertOnlineInscriptionForAutoEcole(prisma, autoEcoleId)

  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, autoEcoleId },
  })
  if (!eleve) throw new ApiError(404, "Candidat introuvable.")
  if (eleve.statutInscription !== "EN_ATTENTE") {
    throw new ApiError(400, "Cette demande n'est pas en attente de validation.")
  }

  return prisma.eleve.update({
    where: { id: eleveId },
    data: {
      statutInscription: "REFUSE",
      inscriptionRefusedReason: reason?.trim() || null,
    },
  })
}
