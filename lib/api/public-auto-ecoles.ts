import { hasAutoEcoleAccess } from "@/lib/access"
import { hasOnlineInscriptionFeature } from "@/lib/plan-features"
import { prisma } from "@/lib/prisma"

export type PublicAutoEcoleDto = {
  id: string
  nom: string
  ville: string | null
  wilaya: string | null
  categories: Array<{
    id: string
    code: string
    libelleFr: string
    libelleAr: string | null
    prixPermis: number
  }>
}

/** Auto-écoles avec abonnement actif (ACTIVE payé ou essai TRIAL en cours). */
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
    select: {
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
        orderBy: { ordre: "asc" },
        select: {
          id: true,
          code: true,
          libelleFr: true,
          libelleAr: true,
          prixPermis: true,
        },
      },
    },
  })

  return rows
    .filter((row) => hasAutoEcoleAccess(row, now))
    .filter((row) =>
      hasOnlineInscriptionFeature(row.subscriptionStatus, row.subscriptionPlan),
    )
    .filter((row) => row.categoriesPermis.length > 0)
    .map((row) => ({
      id: row.id,
      nom: row.nom,
      ville: row.ville,
      wilaya: row.wilaya,
      categories: row.categoriesPermis,
    }))
}

export async function assertPublicAutoEcoleForInscription(
  autoEcoleId: string,
): Promise<PublicAutoEcoleDto> {
  const list = await listPublicAutoEcoles()
  const found = list.find((e) => e.id === autoEcoleId)
  if (!found) {
    throw new Error("AUTO_ECOLE_UNAVAILABLE")
  }
  return found
}
