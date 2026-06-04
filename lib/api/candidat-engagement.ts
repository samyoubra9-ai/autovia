import { ApiError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"
import type {
  CandidatEngagementStatut,
  CandidatEngagementType,
  SeanceStatut,
} from "@prisma/client"

export type CandidatEngagementDto = {
  id: string
  type: CandidatEngagementType
  referenceId: string
  statut: CandidatEngagementStatut
  motif: string | null
  reponduAt: string | null
}

/** Ne met en cache que le succès — après création de la table en SQL, pas besoin de redéployer. */
let tableReadyCache = false

export async function isEngagementsTableReady(): Promise<boolean> {
  if (tableReadyCache) return true
  try {
    await prisma.$queryRaw`SELECT 1 FROM candidat_engagements LIMIT 1`
    tableReadyCache = true
    return true
  } catch (error) {
    if (isMissingEngagementTable(error)) {
      console.warn(
        "[candidat-engagement] Table candidat_engagements absente — exécutez docs/sql/candidat-engagements-prod.sql (bloc TABLE) dans Supabase.",
      )
      return false
    }
    throw error
  }
}

/** Crée les demandes manquantes pour les séances / examens à venir (rétroactif). */
export async function ensureEngagementsForEleve(params: {
  autoEcoleId: string
  eleveId: string
  seances: Array<{ id: string; statut: SeanceStatut; dateHeure: Date }>
  examens: Array<{ id: string; resultat: string | null }>
}): Promise<boolean> {
  if (!(await isEngagementsTableReady())) return false

  for (const s of params.seances) {
    await syncSeanceEngagement({
      autoEcoleId: params.autoEcoleId,
      eleveId: params.eleveId,
      seanceId: s.id,
      statut: s.statut,
      dateHeure: s.dateHeure,
    })
  }
  for (const ex of params.examens) {
    await syncExamenEngagement({
      autoEcoleId: params.autoEcoleId,
      eleveId: params.eleveId,
      listeExamenCandidatId: ex.id,
      resultat: ex.resultat,
    })
  }
  return true
}

/** Backdash : aligne les engagements pour toutes les séances futures du tenant. */
export async function ensureEngagementsForTenant(autoEcoleId: string): Promise<boolean> {
  if (!(await isEngagementsTableReady())) return false

  const cutoff = new Date(Date.now() - 30 * 60 * 1000)
  const seances = await prisma.seanceExamen.findMany({
    where: {
      autoEcoleId,
      statut: { not: "annule" },
      dateHeure: { gte: cutoff },
    },
    select: { id: true, eleveId: true, statut: true, dateHeure: true },
  })

  for (const s of seances) {
    await syncSeanceEngagement({
      autoEcoleId,
      eleveId: s.eleveId,
      seanceId: s.id,
      statut: s.statut,
      dateHeure: s.dateHeure,
    })
  }

  const examRows = await prisma.listeExamenCandidat.findMany({
    where: {
      eleve: { autoEcoleId },
      OR: [{ resultat: null }, { resultat: "" }],
    },
    select: { id: true, eleveId: true, resultat: true },
  })

  for (const ex of examRows) {
    await syncExamenEngagement({
      autoEcoleId,
      eleveId: ex.eleveId,
      listeExamenCandidatId: ex.id,
      resultat: ex.resultat,
    })
  }

  return true
}

function isMissingEngagementTable(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? "").toLowerCase()
  return (
    (msg.includes("candidat_engagements") &&
      (msg.includes("does not exist") ||
        msg.includes("n'existe pas") ||
        msg.includes("relation") ||
        msg.includes("table"))) ||
    msg.includes('relation "candidat_engagements" does not exist')
  )
}

export function toCandidatEngagementDto(row: {
  id: string
  type: CandidatEngagementType
  referenceId: string
  statut: CandidatEngagementStatut
  motif: string | null
  reponduAt: Date | null
}): CandidatEngagementDto {
  return {
    id: row.id,
    type: row.type,
    referenceId: row.referenceId,
    statut: row.statut,
    motif: row.motif?.trim() || null,
    reponduAt: row.reponduAt?.toISOString() ?? null,
  }
}

/** Séance annulée ou passée depuis longtemps : pas de demande de confirmation. */
function seanceNeedsConfirmation(statut: SeanceStatut, dateHeure: Date): boolean {
  if (statut === "annule") return false
  const cutoff = Date.now() - 30 * 60 * 1000
  return dateHeure.getTime() >= cutoff
}

function examenNeedsConfirmation(resultat: string | null | undefined): boolean {
  if (!resultat) return true
  const r = String(resultat).trim().toLowerCase()
  return !r || r === "present"
}

export async function syncSeanceEngagement(params: {
  autoEcoleId: string
  eleveId: string
  seanceId: string
  statut: SeanceStatut
  dateHeure: Date
  resetResponse?: boolean
}): Promise<void> {
  if (!seanceNeedsConfirmation(params.statut, params.dateHeure)) {
    try {
      await prisma.candidatEngagement.deleteMany({
        where: { type: "seance", referenceId: params.seanceId },
      })
    } catch (error) {
      if (!isMissingEngagementTable(error)) throw error
    }
    return
  }

  try {
    await prisma.candidatEngagement.upsert({
      where: {
        type_referenceId: { type: "seance", referenceId: params.seanceId },
      },
      create: {
        autoEcoleId: params.autoEcoleId,
        eleveId: params.eleveId,
        type: "seance",
        referenceId: params.seanceId,
        statut: "en_attente",
      },
      update: params.resetResponse
        ? {
            eleveId: params.eleveId,
            autoEcoleId: params.autoEcoleId,
            statut: "en_attente",
            motif: null,
            reponduAt: null,
          }
        : {
            eleveId: params.eleveId,
            autoEcoleId: params.autoEcoleId,
          },
    })
  } catch (error) {
    if (!isMissingEngagementTable(error)) throw error
  }
}

export async function syncExamenEngagement(params: {
  autoEcoleId: string
  eleveId: string
  listeExamenCandidatId: string
  resultat?: string | null
  resetResponse?: boolean
}): Promise<void> {
  if (!examenNeedsConfirmation(params.resultat)) {
    try {
      await prisma.candidatEngagement.deleteMany({
        where: { type: "examen", referenceId: params.listeExamenCandidatId },
      })
    } catch (error) {
      if (!isMissingEngagementTable(error)) throw error
    }
    return
  }

  try {
    await prisma.candidatEngagement.upsert({
      where: {
        type_referenceId: {
          type: "examen",
          referenceId: params.listeExamenCandidatId,
        },
      },
      create: {
        autoEcoleId: params.autoEcoleId,
        eleveId: params.eleveId,
        type: "examen",
        referenceId: params.listeExamenCandidatId,
        statut: "en_attente",
      },
      update: params.resetResponse
        ? {
            eleveId: params.eleveId,
            autoEcoleId: params.autoEcoleId,
            statut: "en_attente",
            motif: null,
            reponduAt: null,
          }
        : {
            eleveId: params.eleveId,
            autoEcoleId: params.autoEcoleId,
          },
    })
  } catch (error) {
    if (!isMissingEngagementTable(error)) throw error
  }
}

export async function deleteSeanceEngagement(seanceId: string): Promise<void> {
  try {
    await prisma.candidatEngagement.deleteMany({
      where: { type: "seance", referenceId: seanceId },
    })
  } catch (error) {
    if (!isMissingEngagementTable(error)) throw error
  }
}

export async function loadEngagementsByEleveId(
  eleveId: string,
): Promise<CandidatEngagementDto[]> {
  try {
    const rows = await prisma.candidatEngagement.findMany({
      where: { eleveId },
      orderBy: { updatedAt: "desc" },
    })
    return rows.map(toCandidatEngagementDto)
  } catch (error) {
    if (isMissingEngagementTable(error)) return []
    throw error
  }
}

export async function loadEngagementsForSeanceIds(
  seanceIds: string[],
): Promise<Map<string, CandidatEngagementDto>> {
  const map = new Map<string, CandidatEngagementDto>()
  if (!seanceIds.length) return map
  try {
    const rows = await prisma.candidatEngagement.findMany({
      where: { type: "seance", referenceId: { in: seanceIds } },
    })
    for (const row of rows) {
      map.set(row.referenceId, toCandidatEngagementDto(row))
    }
  } catch (error) {
    if (!isMissingEngagementTable(error)) throw error
  }
  return map
}

async function ensureEngagementForReference(
  eleveId: string,
  type: CandidatEngagementType,
  referenceId: string,
): Promise<void> {
  if (!(await isEngagementsTableReady())) {
    throw new ApiError(
      503,
      "Confirmation candidat indisponible : exécutez la migration candidat_engagements sur Supabase.",
    )
  }

  if (type === "seance") {
    const seance = await prisma.seanceExamen.findFirst({
      where: { id: referenceId, eleveId },
    })
    if (!seance) {
      throw new ApiError(404, "Séance introuvable pour ce dossier.")
    }
    await syncSeanceEngagement({
      autoEcoleId: seance.autoEcoleId,
      eleveId,
      seanceId: seance.id,
      statut: seance.statut,
      dateHeure: seance.dateHeure,
    })
    return
  }

  const candidat = await prisma.listeExamenCandidat.findFirst({
    where: { id: referenceId, eleveId },
    select: { id: true, resultat: true, eleve: { select: { autoEcoleId: true } } },
  })
  if (!candidat) {
    throw new ApiError(404, "Convocation examen introuvable pour ce dossier.")
  }
  await syncExamenEngagement({
    autoEcoleId: candidat.eleve.autoEcoleId,
    eleveId,
    listeExamenCandidatId: candidat.id,
    resultat: candidat.resultat,
  })
}

export async function respondCandidatEngagement(params: {
  eleveId: string
  engagementId?: string
  type?: CandidatEngagementType
  referenceId?: string
  statut: "accepte" | "refuse"
  motif?: string | null
}): Promise<CandidatEngagementDto> {
  const motifTrim =
    params.motif != null ? String(params.motif).trim() : ""

  if (params.statut === "refuse" && motifTrim.length < 3) {
    throw new ApiError(
      400,
      "Indiquez un motif d’au moins 3 caractères en cas de refus.",
    )
  }

  const engagementId = params.engagementId?.trim()
  const referenceId = params.referenceId?.trim()
  const type = params.type

  if (!engagementId && !(type && referenceId)) {
    throw new ApiError(
      400,
      "Identifiant de confirmation ou référence séance/examen requis.",
    )
  }

  if (type && referenceId) {
    await ensureEngagementForReference(params.eleveId, type, referenceId)
  }

  let row
  try {
    row = engagementId
      ? await prisma.candidatEngagement.findFirst({
          where: { id: engagementId, eleveId: params.eleveId },
        })
      : await prisma.candidatEngagement.findFirst({
          where: {
            type: type!,
            referenceId: referenceId!,
            eleveId: params.eleveId,
          },
        })
  } catch (error) {
    if (isMissingEngagementTable(error)) {
      throw new ApiError(
        503,
        "Confirmation candidat indisponible : migration base de données manquante.",
      )
    }
    throw error
  }

  if (!row) {
    throw new ApiError(404, "Demande de confirmation introuvable.")
  }

  if (row.statut !== "en_attente") {
    throw new ApiError(409, "Vous avez déjà répondu à cette demande.")
  }

  const updated = await prisma.candidatEngagement.update({
    where: { id: row.id },
    data: {
      statut: params.statut,
      motif: params.statut === "refuse" ? motifTrim : motifTrim || null,
      reponduAt: new Date(),
    },
  })

  return toCandidatEngagementDto(updated)
}
