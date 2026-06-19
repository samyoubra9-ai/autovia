import { ApiError } from "@/lib/api/errors"
import type { PrismaDb } from "@/lib/prisma"

export async function assertSetupCanAddEleve(
  prisma: PrismaDb,
  autoEcoleId: string,
): Promise<void> {
  const [catCount, monCount, vehCount] = await Promise.all([
    prisma.categoriePermisEcole.count({
      where: { autoEcoleId, actif: true },
    }),
    prisma.moniteur.count({
      where: { autoEcoleId, actif: true },
    }),
    prisma.vehicule.count({
      where: { autoEcoleId },
    }),
  ])

  if (catCount === 0) {
    throw new ApiError(
      400,
      "Configurez au moins une catégorie de permis avant d'inscrire un candidat.",
      "SETUP_NO_CATEGORIES",
    )
  }
  if (monCount === 0) {
    throw new ApiError(
      400,
      "Ajoutez au moins un moniteur actif avant d'inscrire un candidat.",
      "SETUP_NO_MONITEUR",
    )
  }
  if (vehCount === 0) {
    throw new ApiError(
      400,
      "Ajoutez au moins un véhicule avant d'inscrire un candidat.",
      "SETUP_NO_VEHICULE",
    )
  }
}

export async function assertSetupCanCreateListeExamen(
  prisma: PrismaDb,
  autoEcoleId: string,
): Promise<void> {
  const [eleveCount, monCount, ae] = await Promise.all([
    prisma.eleve.count({ where: { autoEcoleId, statutInscription: "VALIDE" } }),
    prisma.moniteur.count({ where: { autoEcoleId, actif: true } }),
    prisma.autoEcole.findUnique({
      where: { id: autoEcoleId },
      select: { nomAr: true, wilaya: true },
    }),
  ])

  if (!ae) throw new ApiError(404, "Auto-école introuvable.")

  const nomAr = String(ae.nomAr ?? "").trim()
  const wilaya = String(ae.wilaya ?? "").trim()

  if (!nomAr || !wilaya) {
    throw new ApiError(
      400,
      "Complétez le nom arabe et la wilaya dans les paramètres de l'établissement.",
      "SETUP_PRINT_INCOMPLETE",
    )
  }
  if (eleveCount === 0) {
    throw new ApiError(
      400,
      "Inscrivez au moins un candidat avant de créer une liste d'examen.",
      "SETUP_NO_ELEVE",
    )
  }
  if (monCount === 0) {
    throw new ApiError(
      400,
      "Ajoutez au moins un moniteur actif avant de créer une liste d'examen.",
      "SETUP_NO_MONITEUR",
    )
  }
}
