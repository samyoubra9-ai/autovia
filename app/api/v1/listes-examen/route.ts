import { Prisma } from "@prisma/client"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import { assertNatureExamenAllowedForPermis } from "@/lib/api/permis-a1"
import { eleveMatchesListeExamenNature } from "@/lib/api/formation"
import {
  type CandidatInput,
  isEligibleForCirculation,
  parseOptionalListeDateOnly,
  validateCandidatsLimits,
} from "@/lib/api/liste-examen"
import { parseListeExamenHeaderCreate } from "@/lib/api/liste-examen-header"
import { toListeExamenSettings } from "@/lib/api/liste-examen-settings"
import { parseMessagesCategorieInput } from "@/lib/api/liste-examen-messages"
import {
  assignOrdreOnBuiltCandidatRows,
  type BuiltCandidatRow,
} from "@/lib/api/liste-examen-candidat-order"
import { toListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { resolveMoniteurListeSlot } from "@/lib/api/moniteur"
import { assertSetupCanCreateListeExamen } from "@/lib/api/setup-guards"
import { assertCanCreateListeExamenOnPlan } from "@/lib/api/trial-plan-context"
import { allocateReferenceEnvoi } from "@/lib/api/reference-envoi"
import { notifyBackdashExamenListe } from "@/lib/push/backdash-events"
import { syncExamenEngagement } from "@/lib/api/candidat-engagement"
import { notifyCandidatExamenListe } from "@/lib/push/candidat-events"
import {
  lookupDatesDernierExamen,
  resolveDateDernierExamenForCandidat,
} from "@/lib/api/liste-examen-date-dernier"
import { prisma, PRISMA_TRANSACTION_OPTS } from "@/lib/prisma"
import type { NatureExamenListe } from "@prisma/client"

const candidatInclude = {
  eleve: { include: { categoriePermis: true } },
  categoriePermis: true,
} as const

const messagesInclude = {
  messagesCategorie: { include: { categoriePermis: true } },
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

function parseHeader(body: Record<string, unknown>) {
  return parseListeExamenHeaderCreate(body)
}

function parseCandidats(raw: unknown): CandidatInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Sélectionnez au moins un candidat.")
  }
  return raw.map((item) => {
    const o = item as Record<string, unknown>
    const nature = String(o.natureExamen ?? "") as NatureExamenListe
    if (!["code", "creneau", "circulation"].includes(nature)) {
      throw new ApiError(400, "Nature d'examen invalide.")
    }
    const eleveId = String(o.eleveId ?? "").trim()
    if (!eleveId) throw new ApiError(400, "Identifiant candidat manquant.")
    return {
      eleveId,
      natureExamen: nature,
      dateDernierExamen: o.dateDernierExamen ? String(o.dateDernierExamen) : null,
    }
  })
}

function assertNatureAllowed(
  nature: NatureExamenListe,
  settings: ReturnType<typeof toListeExamenSettings>,
): void {
  if (nature === "code" && !settings.natureCodeActive) {
    throw new ApiError(400, "L'examen « code » est désactivé dans vos paramètres.")
  }
  if (nature === "creneau" && !settings.natureCreneauActive) {
    throw new ApiError(400, "L'examen « créneau » est désactivé dans vos paramètres.")
  }
  if (nature === "circulation" && !settings.natureCirculationActive) {
    throw new ApiError(400, "L'examen « circulation » est désactivé dans vos paramètres.")
  }
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const [listes, categories] = await Promise.all([
      prisma.listeExamen.findMany({
        where: { autoEcoleId: tenant.autoEcoleId },
        orderBy: { dateExamen: "desc" },
        include: {
          candidats: { include: candidatInclude },
          ...messagesInclude,
        },
      }),
      ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId),
    ])
    const dtos = listes.map((l) => {
      try {
        return toListeExamenDto(l, categories)
      } catch (mapErr) {
        console.error("[api] toListeExamenDto GET list", l.id, mapErr)
        return null
      }
    })
    return jsonWithCors(
      { listes: dtos.filter((d) => d !== null) },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

function mergeHeaderWithAutoEcole(
  header: ReturnType<typeof parseHeader>,
  ae: {
    nomAr: string | null
    adresseMagasin: string | null
    numeroRegistre: string | null
    telephone: string | null
    referenceEnvoi: string | null
    lieuRedaction: string | null
  } | null,
) {
  return {
    ...header,
    ecoleNomAr: header.ecoleNomAr ?? ae?.nomAr ?? null,
    ecoleAdresse: header.ecoleAdresse ?? ae?.adresseMagasin ?? null,
    ecoleRegistre: header.ecoleRegistre ?? ae?.numeroRegistre ?? null,
    ecoleTelephone: header.ecoleTelephone ?? ae?.telephone ?? null,
    referenceEnvoi: header.referenceEnvoi ?? null,
    lieuRedaction: header.lieuRedaction ?? ae?.lieuRedaction ?? null,
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    await assertSetupCanCreateListeExamen(prisma, tenant.autoEcoleId)
    const body = (await request.json()) as Record<string, unknown>
    const ae = await prisma.autoEcole.findUnique({
      where: { id: tenant.autoEcoleId },
    })
    if (!ae) throw new ApiError(404, "Auto-école introuvable.")

    await assertCanCreateListeExamenOnPlan(
      prisma,
      tenant.autoEcoleId,
      ae.subscriptionStatus,
    )

    const listeSettings = toListeExamenSettings(ae)
    const categories = await ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId)
    const categoriesById = new Map(categories.map((c) => [c.id, c]))

    const headerBase = parseHeader(body)
    let moniteur1Nom = headerBase.moniteur1Nom
    let moniteur1Categorie = headerBase.moniteur1Categorie
    let moniteur2Nom = headerBase.moniteur2Nom
    let moniteur2Categorie = headerBase.moniteur2Categorie
    try {
      const m1 = await resolveMoniteurListeSlot(prisma, tenant.autoEcoleId, body, 1)
      const m2 = await resolveMoniteurListeSlot(prisma, tenant.autoEcoleId, body, 2)
      moniteur1Nom = m1.nom
      moniteur1Categorie = m1.categorie
      moniteur2Nom = m2.nom
      moniteur2Categorie = m2.categorie
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Moniteur invalide.")
    }
    const header = mergeHeaderWithAutoEcole(
      {
        ...headerBase,
        moniteur1Nom,
        moniteur1Categorie,
        moniteur2Nom,
        moniteur2Categorie,
      },
      ae,
    )
    const candidatInputs = parseCandidats(body.candidats)

    const eleveIds = [...new Set(candidatInputs.map((c) => c.eleveId))]
    const eleves = await prisma.eleve.findMany({
      where: { autoEcoleId: tenant.autoEcoleId, id: { in: eleveIds } },
      include: { categoriePermis: true },
    })
    if (eleves.length !== eleveIds.length) {
      throw new ApiError(400, "Un ou plusieurs candidats sont introuvables.")
    }

    const eleveMap = new Map(eleves.map((e) => [e.id, e]))
    const datesLookup = await lookupDatesDernierExamen(
      prisma,
      tenant.autoEcoleId,
      header.dateExamen,
      candidatInputs.map((c) => ({
        eleveId: c.eleveId,
        natureExamen: c.natureExamen,
      })),
    )
    const ordreByCat = new Map<string, number>()
    const built: BuiltCandidatRow[] = []

    for (const input of candidatInputs) {
      const eleve = eleveMap.get(input.eleveId)
      if (!eleve?.categoriePermis) continue

      assertNatureAllowed(input.natureExamen, listeSettings)

      try {
        assertNatureExamenAllowedForPermis(
          eleve.categoriePermis.code,
          input.natureExamen,
          `${eleve.prenom} ${eleve.nom}`,
        )
      } catch (e) {
        throw new ApiError(400, e instanceof Error ? e.message : "Nature invalide.")
      }

      if (
        !eleveMatchesListeExamenNature(eleve, input.natureExamen)
      ) {
        throw new ApiError(
          400,
          `${eleve.prenom} ${eleve.nom} : étape formation incompatible avec « ${input.natureExamen} ».`,
        )
      }

      if (
        input.natureExamen === "circulation" &&
        !isEligibleForCirculation(eleve, header.dateExamen, listeSettings.ageMinCirculation)
      ) {
        throw new ApiError(
          400,
          `${eleve.prenom} ${eleve.nom} : moins de ${listeSettings.ageMinCirculation} ans à la date d'examen.`,
        )
      }

      const catId = eleve.categoriePermisId
      const nextOrdre = (ordreByCat.get(catId) ?? 0) + 1
      ordreByCat.set(catId, nextOrdre)

      built.push({
        eleveId: eleve.id,
        categoriePermisId: catId,
        ordre: nextOrdre,
        natureExamen: input.natureExamen,
        dateDernierExamen: resolveDateDernierExamenForCandidat(
          datesLookup,
          eleve.id,
          input.natureExamen,
          parseOptionalListeDateOnly(input.dateDernierExamen),
        ),
      })
    }

    validateCandidatsLimits(built, categoriesById)

    const dossierByEleve = new Map(eleves.map((e) => [e.id, e.numeroDossier]))
    const builtOrdered = assignOrdreOnBuiltCandidatRows(built, dossierByEleve)
    const candidatCreateRows: Prisma.ListeExamenCandidatUncheckedCreateWithoutListeExamenInput[] =
      builtOrdered.map((row) => ({
        eleveId: row.eleveId,
        categoriePermisId: row.categoriePermisId,
        ordre: row.ordre,
        natureExamen: row.natureExamen,
        dateDernierExamen: row.dateDernierExamen,
      }))

    const messageRows = parseMessagesCategorieInput(body.messagesCategorie, categories)

    const liste = await prisma.$transaction(
      async (tx) => {
        const referenceEnvoi =
          header.referenceEnvoi?.trim() ||
          (await allocateReferenceEnvoi(tx, tenant.autoEcoleId, header.dateDepot))

        return tx.listeExamen.create({
          data: {
            autoEcoleId: tenant.autoEcoleId,
            ...header,
            referenceEnvoi,
            candidats: { create: candidatCreateRows },
            ...(messageRows.length > 0 && {
              messagesCategorie: {
                create: messageRows.map((r) => ({
                  categoriePermisId: r.categoriePermisId,
                  message: r.message,
                  heureConvocation: r.heureConvocation,
                })),
              },
            }),
          },
          include: {
            candidats: { include: candidatInclude },
            messagesCategorie: { include: { categoriePermis: true } },
          },
        })
      },
      PRISMA_TRANSACTION_OPTS,
    )

    const messageByCat = new Map(
      (liste.messagesCategorie ?? []).map((m) => [
        m.categoriePermisId,
        {
          message: m.message,
          heureConvocation: m.heureConvocation,
        },
      ]),
    )

    for (const c of liste.candidats) {
      const msg = messageByCat.get(c.categoriePermisId)
      await syncExamenEngagement({
        autoEcoleId: tenant.autoEcoleId,
        eleveId: c.eleveId,
        listeExamenCandidatId: c.id,
        resultat: c.resultat,
      })
      notifyCandidatExamenListe({
        eleveId: c.eleveId,
        dateExamen: liste.dateExamen,
        centreExamen: liste.centreExamen,
        wilaya: liste.wilaya,
        natureExamen: c.natureExamen,
        heureConvocation: msg?.heureConvocation,
        messageCategorie: msg?.message,
      })
      notifyBackdashExamenListe({
        autoEcoleId: tenant.autoEcoleId,
        eleveId: c.eleveId,
        dateExamen: liste.dateExamen,
        centreExamen: liste.centreExamen,
        natureExamen: c.natureExamen,
      })
    }

    let dto
    try {
      dto = toListeExamenDto(liste, categories)
    } catch (mapErr) {
      console.error("[api] toListeExamenDto POST", mapErr)
      throw new ApiError(500, "Liste créée mais lecture impossible.")
    }
    return jsonWithCors({ liste: dto }, origin, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2028") {
        return handleApiError(
          new ApiError(
            503,
            "La création de la liste a pris trop de temps. Réessayez dans quelques secondes ou réduisez le nombre de candidats.",
          ),
          origin,
        )
      }
      if (error.code === "P2021" || error.code === "P2022") {
        return handleApiError(
          new ApiError(
            500,
            "Tables listes d'examen absentes ou incomplètes. Exécutez les migrations Supabase récentes.",
          ),
          origin,
        )
      }
      if (error.code === "P2002") {
        return handleApiError(
          new ApiError(409, "Conflit : un candidat ou un ordre est déjà utilisé sur cette liste."),
          origin,
        )
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      return handleApiError(
        new ApiError(
          400,
          "Données de la liste invalides. Vérifiez les dates, le centre et les candidats sélectionnés.",
        ),
        origin,
      )
    }
    return handleApiError(error, origin)
  }
}
