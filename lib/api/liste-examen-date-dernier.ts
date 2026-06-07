import type { NatureExamenListe, Prisma } from "@prisma/client"
import { calendarDayUtc } from "@/lib/api/liste-examen"
import { prisma, PRISMA_TRANSACTION_OPTS } from "@/lib/prisma"

export type DateDernierExamenKey = `${string}:${NatureExamenListe}`

export function dateDernierExamenKey(
  eleveId: string,
  nature: NatureExamenListe,
): DateDernierExamenKey {
  return `${eleveId}:${nature}`
}

type DbClient =
  | Prisma.TransactionClient
  | typeof prisma
  | {
      listeExamenCandidat: Prisma.TransactionClient["listeExamenCandidat"]
    }

/** Nature(s) à consulter dans l'historique pour remplir « تاريخ آخر امتحان ». */
export function natureFallbackChainForDernierExamen(
  nature: NatureExamenListe,
): NatureExamenListe[] {
  if (nature === "code") return ["code"]
  if (nature === "creneau") return ["creneau", "code"]
  return ["circulation", "creneau", "code"]
}

function naturesForHistoriqueLookup(
  items: { natureExamen: NatureExamenListe }[],
): NatureExamenListe[] {
  const set = new Set<NatureExamenListe>()
  for (const item of items) {
    for (const n of natureFallbackChainForDernierExamen(item.natureExamen)) {
      set.add(n)
    }
  }
  return [...set]
}

/** Début de journée calendaire UTC (aligné sur les champs @db.Date). */
export function calendarDayStart(d: Date): Date {
  return calendarDayUtc(d)
}

/** Vrai si `candidate` est un jour calendaire strictement avant `beforeDateExamen`. */
export function isExamDateStrictlyBefore(candidate: Date, beforeDateExamen: Date): boolean {
  return (
    calendarDayStart(candidate).getTime() < calendarDayStart(beforeDateExamen).getTime()
  )
}

function pushMaxDate(
  result: Map<DateDernierExamenKey, Date>,
  key: DateDernierExamenKey,
  candidate: Date | null | undefined,
  beforeDateExamen: Date,
): void {
  if (!candidate || !isExamDateStrictlyBefore(candidate, beforeDateExamen)) return
  const prev = result.get(key)
  if (!prev || candidate.getTime() > prev.getTime()) {
    result.set(key, candidate)
  }
}

/**
 * Dernière date d'examen antérieure au jour de `beforeDateExamen`.
 * Pour créneau / circulation : inclut aussi les listes code (resp. créneau) antérieures.
 */
export async function lookupDatesDernierExamen(
  db: DbClient,
  autoEcoleId: string,
  beforeDateExamen: Date,
  items: { eleveId: string; natureExamen: NatureExamenListe }[],
  excludeListeExamenId?: string | null,
): Promise<Map<DateDernierExamenKey, Date>> {
  const eleveIds = [...new Set(items.map((i) => i.eleveId))]
  if (eleveIds.length === 0) return new Map()

  const natures = naturesForHistoriqueLookup(items)

  const rows = await db.listeExamenCandidat.findMany({
    where: {
      eleveId: { in: eleveIds },
      natureExamen: { in: natures },
      listeExamen: {
        autoEcoleId,
        ...(excludeListeExamenId ? { id: { not: excludeListeExamenId } } : {}),
      },
    },
    select: {
      eleveId: true,
      natureExamen: true,
      dateDernierExamen: true,
      listeExamen: { select: { id: true, dateExamen: true } },
    },
  })

  const result = new Map<DateDernierExamenKey, Date>()
  for (const row of rows) {
    const key = dateDernierExamenKey(row.eleveId, row.natureExamen)
    pushMaxDate(result, key, row.listeExamen.dateExamen, beforeDateExamen)
    pushMaxDate(result, key, row.dateDernierExamen, beforeDateExamen)
  }
  return result
}

export function resolveDateDernierExamenForCandidat(
  lookup: Map<DateDernierExamenKey, Date>,
  eleveId: string,
  nature: NatureExamenListe,
  manual: Date | null | undefined,
): Date | null {
  if (manual) return manual
  let best: Date | null = null
  for (const n of natureFallbackChainForDernierExamen(nature)) {
    const d = lookup.get(dateDernierExamenKey(eleveId, n))
    if (d && (!best || d.getTime() > best.getTime())) {
      best = d
    }
  }
  return best
}

type ListeWithCandidatsDates = {
  id: string
  autoEcoleId: string
  dateExamen: Date
  candidats: {
    id: string
    eleveId: string
    natureExamen: NatureExamenListe
    dateDernierExamen: Date | null
  }[]
}

/** Complète en base les dates manquantes (listes créées avant correction ou sans historique au moment T). */
export async function fillMissingDatesDernierExamenOnListe(
  liste: ListeWithCandidatsDates,
): Promise<void> {
  const missing = liste.candidats.filter((c) => !c.dateDernierExamen)
  if (missing.length === 0) return

  const lookup = await lookupDatesDernierExamen(
    prisma,
    liste.autoEcoleId,
    liste.dateExamen,
    missing.map((c) => ({
      eleveId: c.eleveId,
      natureExamen: c.natureExamen,
    })),
    liste.id,
  )

  const updates: { id: string; date: Date }[] = []
  for (const c of missing) {
    const date = resolveDateDernierExamenForCandidat(lookup, c.eleveId, c.natureExamen, null)
    if (date) {
      c.dateDernierExamen = date
      updates.push({ id: c.id, date })
    }
  }

  if (updates.length === 0) return

  await prisma.$transaction(
    async (tx) => {
      for (const u of updates) {
        await tx.listeExamenCandidat.update({
          where: { id: u.id },
          data: { dateDernierExamen: u.date },
        })
      }
    },
    PRISMA_TRANSACTION_OPTS,
  )
}

/** Recalcule « تاريخ آخر امتحان » pour tous les candidats après changement de date d'examen. */
export async function refreshDatesDernierExamenOnListe(
  db: DbClient,
  params: {
    listeId: string
    autoEcoleId: string
    dateExamen: Date
    candidats: {
      id: string
      eleveId: string
      natureExamen: NatureExamenListe
    }[]
  },
): Promise<void> {
  if (params.candidats.length === 0) return

  const lookup = await lookupDatesDernierExamen(
    db,
    params.autoEcoleId,
    params.dateExamen,
    params.candidats.map((c) => ({
      eleveId: c.eleveId,
      natureExamen: c.natureExamen,
    })),
    params.listeId,
  )

  await prisma.$transaction(
    async (tx) => {
      for (const c of params.candidats) {
        const date = resolveDateDernierExamenForCandidat(
          lookup,
          c.eleveId,
          c.natureExamen,
          null,
        )
        await tx.listeExamenCandidat.update({
          where: { id: c.id },
          data: { dateDernierExamen: date },
        })
      }
    },
    PRISMA_TRANSACTION_OPTS,
  )
}
