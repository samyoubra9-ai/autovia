import type { NatureExamenListe, Prisma } from "@prisma/client"
import { ApiError } from "@/lib/api/errors"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import { syncExamenEngagement } from "@/lib/api/candidat-engagement"
import { eleveMatchesListeExamenNature } from "@/lib/api/formation"
import {
  type CandidatInput,
  isEligibleForCirculation,
  parseOptionalListeDateOnly,
  validateCandidatsLimits,
} from "@/lib/api/liste-examen"
import { toListeExamenSettings } from "@/lib/api/liste-examen-settings"
import {
  lookupDatesDernierExamen,
  resolveDateDernierExamenForCandidat,
} from "@/lib/api/liste-examen-date-dernier"
import { assertNatureExamenAllowedForPermis } from "@/lib/api/permis-a1"
import { eleveUpdateOnRemoveAdmisCandidat } from "@/lib/api/liste-examen-resultats"
import { notifyBackdashExamenListe } from "@/lib/push/backdash-events"
import { notifyCandidatExamenListe } from "@/lib/push/candidat-events"
import { reorderListeExamenCandidatsOrdre } from "@/lib/api/liste-examen-reorder-candidats"
import { prisma, PRISMA_TRANSACTION_OPTS } from "@/lib/prisma"

const candidatInclude = {
  eleve: { include: { categoriePermis: true } },
  categoriePermis: true,
} as const

const listeInclude = {
  candidats: { include: candidatInclude },
  messagesCategorie: { include: { categoriePermis: true } },
} as const

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

export function parseAddCandidatsInput(raw: unknown): CandidatInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Sélectionnez au moins un candidat à ajouter.")
  }
  const out: CandidatInput[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    const o = item as Record<string, unknown>
    const nature = String(o.natureExamen ?? "") as NatureExamenListe
    if (!["code", "creneau", "circulation"].includes(nature)) {
      throw new ApiError(400, "Nature d'examen invalide.")
    }
    const eleveId = String(o.eleveId ?? "").trim()
    if (!eleveId) throw new ApiError(400, "Identifiant candidat manquant.")
    if (seen.has(eleveId)) {
      throw new ApiError(400, "Un même candidat ne peut pas être ajouté deux fois.")
    }
    seen.add(eleveId)
    out.push({
      eleveId,
      natureExamen: nature,
      dateDernierExamen: o.dateDernierExamen ? String(o.dateDernierExamen) : null,
    })
  }
  return out
}

type BuiltCandidat = {
  eleveId: string
  categoriePermisId: string
  ordre: number
  natureExamen: NatureExamenListe
  dateDernierExamen: Date | null
}

export async function addCandidatsToListeExamen(
  autoEcoleId: string,
  listeId: string,
  inputs: CandidatInput[],
) {
  const [liste, ae, categories] = await Promise.all([
    prisma.listeExamen.findFirst({
      where: { id: listeId, autoEcoleId },
      include: { candidats: true, messagesCategorie: true },
    }),
    prisma.autoEcole.findUnique({ where: { id: autoEcoleId } }),
    ensureDefaultCategoriesPermis(prisma, autoEcoleId),
  ])
  if (!liste) throw new ApiError(404, "Liste introuvable.")
  if (!ae) throw new ApiError(404, "Auto-école introuvable.")

  const listeSettings = toListeExamenSettings(ae)
  const categoriesById = new Map(categories.map((c) => [c.id, c]))
  const existingEleveIds = new Set(liste.candidats.map((c) => c.eleveId))

  for (const input of inputs) {
    if (existingEleveIds.has(input.eleveId)) {
      throw new ApiError(400, "Un ou plusieurs candidats sont déjà inscrits sur cette liste.")
    }
  }

  const eleveIds = inputs.map((c) => c.eleveId)
  const eleves = await prisma.eleve.findMany({
    where: { autoEcoleId, id: { in: eleveIds } },
    include: { categoriePermis: true },
  })
  if (eleves.length !== eleveIds.length) {
    throw new ApiError(400, "Un ou plusieurs candidats sont introuvables.")
  }

  const eleveMap = new Map(eleves.map((e) => [e.id, e]))
  const datesLookup = await lookupDatesDernierExamen(
    prisma,
    autoEcoleId,
    liste.dateExamen,
    inputs.map((c) => ({
      eleveId: c.eleveId,
      natureExamen: c.natureExamen,
    })),
    liste.id,
  )

  const maxOrdreByCat = new Map<string, number>()
  for (const c of liste.candidats) {
    const prev = maxOrdreByCat.get(c.categoriePermisId) ?? 0
    maxOrdreByCat.set(c.categoriePermisId, Math.max(prev, c.ordre))
  }

  const built: BuiltCandidat[] = []

  for (const input of inputs) {
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

    if (!eleveMatchesListeExamenNature(eleve, input.natureExamen)) {
      throw new ApiError(
        400,
        `${eleve.prenom} ${eleve.nom} : étape formation incompatible avec « ${input.natureExamen} ».`,
      )
    }

    if (
      input.natureExamen === "circulation" &&
      !isEligibleForCirculation(eleve, liste.dateExamen, listeSettings.ageMinCirculation)
    ) {
      throw new ApiError(
        400,
        `${eleve.prenom} ${eleve.nom} : moins de ${listeSettings.ageMinCirculation} ans à la date d'examen.`,
      )
    }

    const catId = eleve.categoriePermisId
    const nextOrdre = (maxOrdreByCat.get(catId) ?? 0) + 1
    maxOrdreByCat.set(catId, nextOrdre)

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

  const allForLimits = [
    ...liste.candidats.map((c) => ({ categoriePermisId: c.categoriePermisId })),
    ...built,
  ]
  validateCandidatsLimits(allForLimits, categoriesById)

  const messageByCat = new Map(
    (liste.messagesCategorie ?? []).map((m) => [
      m.categoriePermisId,
      {
        message: m.message,
        heureConvocation: m.heureConvocation,
      },
    ]),
  )

  await prisma.$transaction(
    async (tx) => {
      for (const row of built) {
        await tx.listeExamenCandidat.create({
          data: {
            listeExamenId: liste.id,
            ...row,
          },
        })
      }
      await reorderListeExamenCandidatsOrdre(tx, liste.id)
      await tx.listeExamen.update({
        where: { id: liste.id },
        data: { updatedAt: new Date() },
      })
    },
    PRISMA_TRANSACTION_OPTS,
  )

  const refreshed = await prisma.listeExamen.findFirst({
    where: { id: liste.id },
    include: listeInclude,
  })
  if (!refreshed) throw new ApiError(404, "Liste introuvable.")

  const createdRows = refreshed.candidats.filter((c) =>
    built.some((b) => b.eleveId === c.eleveId),
  )

  for (const c of createdRows) {
    const msg = messageByCat.get(c.categoriePermisId)
    await syncExamenEngagement({
      autoEcoleId,
      eleveId: c.eleveId,
      listeExamenCandidatId: c.id,
      resultat: c.resultat,
    })
    notifyCandidatExamenListe({
      eleveId: c.eleveId,
      dateExamen: refreshed.dateExamen,
      centreExamen: refreshed.centreExamen,
      wilaya: refreshed.wilaya,
      natureExamen: c.natureExamen,
      heureConvocation: msg?.heureConvocation,
      messageCategorie: msg?.message,
    })
    notifyBackdashExamenListe({
      autoEcoleId,
      eleveId: c.eleveId,
      dateExamen: refreshed.dateExamen,
      centreExamen: refreshed.centreExamen,
      natureExamen: c.natureExamen,
    })
  }

  return refreshed
}

export async function removeCandidatFromListeExamen(
  autoEcoleId: string,
  listeId: string,
  candidatId: string,
) {
  const liste = await prisma.listeExamen.findFirst({
    where: { id: listeId, autoEcoleId },
    include: {
      candidats: { include: candidatInclude },
    },
  })
  if (!liste) throw new ApiError(404, "Liste introuvable.")

  const candidat = liste.candidats.find((c) => c.id === candidatId)
  if (!candidat) throw new ApiError(404, "Candidat introuvable sur cette liste.")

  await syncExamenEngagement({
    autoEcoleId,
    eleveId: candidat.eleveId,
    listeExamenCandidatId: candidat.id,
    resultat: "admis",
  })

  await prisma.$transaction(
    async (tx) => {
      await tx.listeExamenCandidat.delete({ where: { id: candidat.id } })

      await reorderListeExamenCandidatsOrdre(tx, liste.id)

      if (candidat.resultat === "admis") {
        const patch = eleveUpdateOnRemoveAdmisCandidat(candidat.eleve, candidat.natureExamen)
        if (patch && Object.keys(patch).length > 0) {
          await tx.eleve.update({
            where: { id: candidat.eleveId },
            data: patch,
          })
        }
      }

      await tx.listeExamen.update({
        where: { id: liste.id },
        data: { updatedAt: new Date() },
      })
    },
    PRISMA_TRANSACTION_OPTS,
  )

  const refreshed = await prisma.listeExamen.findFirst({
    where: { id: liste.id },
    include: listeInclude,
  })
  if (!refreshed) throw new ApiError(404, "Liste introuvable.")

  return refreshed
}

export type ListeExamenWithCandidats = Prisma.ListeExamenGetPayload<{
  include: typeof listeInclude
}>
