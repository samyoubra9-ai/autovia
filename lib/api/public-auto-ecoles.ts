import { hasAutoEcoleAccess } from "@/lib/access"
import { ApiError } from "@/lib/api/errors"
import { hasOnlineInscriptionFeature } from "@/lib/plan-features"
import { prisma } from "@/lib/prisma"

export type PublicCategoriePermisDto = {
  id: string
  code: string
  libelleFr: string
  libelleAr: string | null
  prixPermis: number
}

export type PublicAutoEcoleDto = {
  id: string
  nom: string
  ville: string | null
  wilaya: string | null
}

const publicAutoEcoleSelect = {
  id: true,
  nom: true,
  ville: true,
  wilaya: true,
  subscriptionStatus: true,
  subscriptionPlan: true,
  trialEndsAt: true,
  paidUntil: true,
  verificationStatus: true,
  categoriesPermis: {
    where: { actif: true },
    select: { id: true },
  },
} as const

function isEligibleForPublicInscription(row: {
  subscriptionStatus: Parameters<typeof hasOnlineInscriptionFeature>[0]
  subscriptionPlan: Parameters<typeof hasOnlineInscriptionFeature>[1]
  categoriesPermis: { id: string }[]
}): boolean {
  return (
    hasOnlineInscriptionFeature(row.subscriptionStatus, row.subscriptionPlan) &&
    row.categoriesPermis.length > 0
  )
}

/** Auto-écoles avec inscription en ligne active et au moins une catégorie active. */
export async function listPublicAutoEcoles(): Promise<PublicAutoEcoleDto[]> {
  const now = new Date()
  const rows = await prisma.autoEcole.findMany({
    where: {
      OR: [
        {
          subscriptionStatus: "ACTIVE",
          OR: [{ paidUntil: null }, { paidUntil: { gte: now } }],
        },
        {
          subscriptionStatus: "TRIAL",
          trialEndsAt: { gt: now },
        },
      ],
    },
    orderBy: [{ wilaya: "asc" }, { ville: "asc" }, { nom: "asc" }],
    select: publicAutoEcoleSelect,
  })

  return rows
    .filter((row) => hasAutoEcoleAccess(row, now))
    .filter((row) => isEligibleForPublicInscription(row))
    .map((row) => ({
      id: row.id,
      nom: row.nom,
      ville: row.ville,
      wilaya: row.wilaya,
    }))
}

export async function assertPublicAutoEcoleForInscription(
  autoEcoleId: string,
): Promise<PublicAutoEcoleDto> {
  const list = await listPublicAutoEcoles()
  const found = list.find((e) => e.id === autoEcoleId)
  if (!found) {
    throw new ApiError(
      400,
      "Cette auto-école n'accepte pas les inscriptions en ligne pour le moment.",
      "AUTO_ECOLE_UNAVAILABLE",
    )
  }
  return found
}

/** Catégories actives configurées pour une auto-école (inscription en ligne). */
export async function listPublicCategoriesForAutoEcole(
  autoEcoleId: string,
): Promise<PublicCategoriePermisDto[]> {
  await assertPublicAutoEcoleForInscription(autoEcoleId)

  return prisma.categoriePermisEcole.findMany({
    where: { autoEcoleId, actif: true },
    orderBy: [{ ordre: "asc" }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      libelleFr: true,
      libelleAr: true,
      prixPermis: true,
    },
  })
}
