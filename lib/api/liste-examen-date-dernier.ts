import type { NatureExamenListe, Prisma } from "@prisma/client"

export type DateDernierExamenKey = `${string}:${NatureExamenListe}`

export function dateDernierExamenKey(
  eleveId: string,
  nature: NatureExamenListe,
): DateDernierExamenKey {
  return `${eleveId}:${nature}`
}

type DbClient = Prisma.TransactionClient | {
  listeExamenCandidat: Prisma.TransactionClient["listeExamenCandidat"]
}

/**
 * Dernière date d'examen officielle (même nature) antérieure à `beforeDateExamen`.
 * Source : listes d'examen précédentes de l'auto-école (date de la liste).
 */
export async function lookupDatesDernierExamen(
  db: DbClient,
  autoEcoleId: string,
  beforeDateExamen: Date,
  items: { eleveId: string; natureExamen: NatureExamenListe }[],
): Promise<Map<DateDernierExamenKey, Date>> {
  const eleveIds = [...new Set(items.map((i) => i.eleveId))]
  if (eleveIds.length === 0) return new Map()

  const rows = await db.listeExamenCandidat.findMany({
    where: {
      eleveId: { in: eleveIds },
      listeExamen: {
        autoEcoleId,
        dateExamen: { lt: beforeDateExamen },
      },
    },
    select: {
      eleveId: true,
      natureExamen: true,
      listeExamen: { select: { dateExamen: true } },
    },
    orderBy: { listeExamen: { dateExamen: "desc" } },
  })

  const result = new Map<DateDernierExamenKey, Date>()
  for (const row of rows) {
    const key = dateDernierExamenKey(row.eleveId, row.natureExamen)
    if (!result.has(key)) {
      result.set(key, row.listeExamen.dateExamen)
    }
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
  return lookup.get(dateDernierExamenKey(eleveId, nature)) ?? null
}
