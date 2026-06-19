import { randomBytes } from "crypto"

import type { PrismaClient } from "@prisma/client"

/** Identifiant provisoire pour pré-inscription (remplacé à la validation). */
export async function generatePendingEleveIdentifiant(
  db: PrismaClient,
  autoEcoleId: string,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const suffix = randomBytes(4).toString("hex").toUpperCase()
    const identifiant = `PRE-${suffix}`
    const exists = await db.eleve.findFirst({
      where: { autoEcoleId, identifiant },
      select: { id: true },
    })
    if (!exists) return identifiant
  }
  throw new Error("Impossible de générer un identifiant provisoire.")
}
