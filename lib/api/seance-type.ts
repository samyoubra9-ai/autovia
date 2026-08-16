import { ApiError } from "@/lib/api/errors"
import type { SeanceType } from "@prisma/client"

/** Types planifiables en séance (formation uniquement — pas l'examen officiel). */
export const SEANCE_TYPES_FORMATION = ["code", "creneau", "circulation"] as const

export const SEANCE_TYPES = ["code", "creneau", "circulation", "examen"] as const

export const SEANCE_TYPE_LABELS: Record<SeanceType, string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
  examen: "Examen",
}

export function parseSeanceType(raw: unknown): SeanceType {
  const value = String(raw ?? "code").trim() as SeanceType
  if (!SEANCE_TYPES.includes(value)) {
    throw new ApiError(
      400,
      "Type de séance invalide (code, creneau, circulation).",
    )
  }
  if (value === "examen") {
    throw new ApiError(
      400,
      "Les examens officiels se planifient dans Listes d'examen, pas en séance.",
    )
  }
  return value
}
