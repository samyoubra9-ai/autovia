import { ApiError } from "@/lib/api/errors"

export const RESULTATS_EXAMEN = [
  "present",
  "absent_j",
  "absent_nj",
  "annule",
  "rejete",
  "ajourne",
  "admis",
] as const

export type ResultatExamenCandidat = (typeof RESULTATS_EXAMEN)[number]

export type ResultatSexe = "masculin" | "feminin"

export const RESULTAT_LABELS: Record<ResultatExamenCandidat, string> = {
  present: "Présent",
  absent_j: "Absent justifié",
  absent_nj: "Absent non justifié",
  annule: "Annulé",
  rejete: "Rejeté",
  ajourne: "Ajourné",
  admis: "Admis",
}

/** Libellés arabes masculins (impression officielle). */
export const RESULTAT_PRINT_M: Record<ResultatExamenCandidat, string> = {
  present: "حاضر",
  absent_j: "غ.م",
  absent_nj: "غ.غ.م",
  annule: "ملغى",
  rejete: "راسب",
  ajourne: "مؤجل",
  admis: "ناجح",
}

/** Libellés arabes féminins (impression officielle). */
export const RESULTAT_PRINT_F: Record<ResultatExamenCandidat, string> = {
  present: "حاضرة",
  absent_j: "غ.م",
  absent_nj: "غ.غ.م",
  annule: "ملغاة",
  rejete: "راسبة",
  ajourne: "مؤجلة",
  admis: "ناجحة",
}

/** @deprecated Préférer formatResultatPrint avec le sexe du candidat. */
export const RESULTAT_PRINT: Record<ResultatExamenCandidat, string> = RESULTAT_PRINT_M

export function parseResultatExamen(raw: unknown): ResultatExamenCandidat | null {
  if (raw === null || raw === undefined || raw === "") return null
  const value = String(raw).trim() as ResultatExamenCandidat
  if (!RESULTATS_EXAMEN.includes(value)) {
    throw new ApiError(400, "Résultat d'examen invalide.")
  }
  return value
}

/** Lecture depuis la BDD (colonne TEXT). */
export function parseResultatStored(raw: string | null | undefined): ResultatExamenCandidat | null {
  if (!raw?.trim()) return null
  const value = raw.trim() as ResultatExamenCandidat
  return RESULTATS_EXAMEN.includes(value) ? value : null
}

export function formatResultatPrint(
  resultat: ResultatExamenCandidat | null | undefined,
  sexe: ResultatSexe = "masculin",
): string {
  if (!resultat) return ""
  const table = sexe === "feminin" ? RESULTAT_PRINT_F : RESULTAT_PRINT_M
  return table[resultat] ?? ""
}
