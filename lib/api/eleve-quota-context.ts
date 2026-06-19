import type { PrismaDb } from "@/lib/prisma"
import {
  buildEleveQuotaSnapshot,
  type EleveQuotaInput,
  type EleveQuotaSnapshot,
} from "@/lib/eleve-quota"

export async function loadEleveQuotaInput(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<EleveQuotaInput> {
  const [autoEcole, currentEleveCount, categories] = await Promise.all([
    db.autoEcole.findUniqueOrThrow({
      where: { id: autoEcoleId },
      select: {
        subscriptionStatus: true,
        subscriptionPlan: true,
        maxElevesOverride: true,
      },
    }),
    db.eleve.count({
      where: { autoEcoleId, statutInscription: "VALIDE" },
    }),
    db.categoriePermisEcole.findMany({
      where: { autoEcoleId, actif: true },
      select: { code: true },
    }),
  ])

  return {
    subscriptionStatus: autoEcole.subscriptionStatus,
    subscriptionPlan: autoEcole.subscriptionPlan,
    maxElevesOverride: autoEcole.maxElevesOverride,
    activeCategoryCodes: categories.map((c) => c.code),
    currentEleveCount,
  }
}

export async function loadEleveQuotaSnapshot(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<EleveQuotaSnapshot> {
  const input = await loadEleveQuotaInput(db, autoEcoleId)
  return buildEleveQuotaSnapshot(input)
}
