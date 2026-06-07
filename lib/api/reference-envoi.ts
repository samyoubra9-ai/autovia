import type { Prisma } from "@prisma/client"

type Db = Prisma.TransactionClient | Prisma.DefaultPrismaClient

const REF_PATTERN = /^(\d{4})\/(\d{1,4})$/

/**
 * Numéro de bordereau unique par auto-école : YYYY/NN (ex. 2026/01, 2026/02).
 */
export async function allocateReferenceEnvoi(
  db: Db,
  autoEcoleId: string,
  dateDepot: Date,
): Promise<string> {
  const year = dateDepot.getUTCFullYear()
  const prefix = `${year}/`

  const listes = await db.listeExamen.findMany({
    where: {
      autoEcoleId,
      referenceEnvoi: { startsWith: prefix },
    },
    select: { referenceEnvoi: true },
  })

  let maxSeq = 0
  for (const row of listes) {
    const ref = row.referenceEnvoi?.trim()
    if (!ref) continue
    const m = ref.match(REF_PATTERN)
    if (m && Number(m[1]) === year) {
      maxSeq = Math.max(maxSeq, parseInt(m[2], 10))
    }
  }

  return `${year}/${String(maxSeq + 1).padStart(2, "0")}`
}
