import { ApiError } from "@/lib/api/errors"
import type { PrismaDb } from "@/lib/prisma"

export type EleveRelationsIds = {
  moniteurId: string | null
  vehiculeId: string | null
}

export async function assertEleveMoniteurVehiculeForTenant(
  prisma: PrismaDb,
  autoEcoleId: string,
  moniteurId: unknown,
  vehiculeId: unknown,
  options?: { required?: boolean },
): Promise<EleveRelationsIds> {
  const required = options?.required ?? false
  const mId = String(moniteurId ?? "").trim() || null
  const vId = String(vehiculeId ?? "").trim() || null

  if (required && (!mId || !vId)) {
    throw new ApiError(400, "Moniteur et véhicule sont requis.")
  }

  if (mId) {
    const m = await prisma.moniteur.findFirst({
      where: { id: mId, autoEcoleId, actif: true },
    })
    if (!m) throw new ApiError(400, "Moniteur introuvable ou inactif.")
  }

  if (vId) {
    const v = await prisma.vehicule.findFirst({
      where: { id: vId, autoEcoleId },
    })
    if (!v) throw new ApiError(400, "Véhicule introuvable.")
  }

  return { moniteurId: mId, vehiculeId: vId }
}
