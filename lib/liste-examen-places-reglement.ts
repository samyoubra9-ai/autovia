import {
  isSemiRemorquePermisCode,
  listeExamenGroupKey,
} from '@/lib/api/liste-examen-groups'

/**
 * Barème officiel liste d'examen — places max. par section :
 * B = 15, A + A1 (même section, quota partagé) = 10 au total,
 * semi-remorque (BE, CE, DE, C1E) = 15 (liste séparée à l'impression), autres = 5.
 */
export const LISTE_EXAMEN_PLACES_REGLEMENT = {
  groupeB: 15,
  groupeA: 10,
  groupeSemiRemorque: 15,
  autres: 5,
} as const

export function placesListeMaxForPermisCode(code: string): number {
  const c = code.trim().toUpperCase()
  if (c === 'B') return LISTE_EXAMEN_PLACES_REGLEMENT.groupeB
  if (c === 'A' || c === 'A1') return LISTE_EXAMEN_PLACES_REGLEMENT.groupeA
  if (isSemiRemorquePermisCode(c)) return LISTE_EXAMEN_PLACES_REGLEMENT.groupeSemiRemorque
  return LISTE_EXAMEN_PLACES_REGLEMENT.autres
}

/** Clé de section impression (A regroupe A + A1). */
export function placesListeMaxForGroupKey(groupKey: string): number {
  const gk = groupKey.trim().toUpperCase()
  if (gk === 'B') return LISTE_EXAMEN_PLACES_REGLEMENT.groupeB
  if (gk === 'A') return LISTE_EXAMEN_PLACES_REGLEMENT.groupeA
  if (isSemiRemorquePermisCode(gk)) return LISTE_EXAMEN_PLACES_REGLEMENT.groupeSemiRemorque
  return LISTE_EXAMEN_PLACES_REGLEMENT.autres
}

export function clampPlacesListe(code: string, places: number): number {
  const max = placesListeMaxForPermisCode(code)
  const n = Math.round(Number(places))
  if (!Number.isFinite(n) || n < 1) return max
  return Math.min(max, n)
}

export function placesReglementLabelForCode(code: string): string {
  const c = code.trim().toUpperCase()
  if (c === 'B') return 'B — 15 places max.'
  if (c === 'A' || c === 'A1') return 'A / A1 — 10 places max. (partagées)'
  if (isSemiRemorquePermisCode(c)) return `${c} — 15 places max. (liste semi-remorque séparée)`
  return `${c || 'Autre'} — 5 places max.`
}

/** Lignes du tableau pour une section : toujours le barème fixe (candidats + lignes vides). */
export function sectionTableRowCount(groupKey: string, candidatCount: number): number {
  const cap = placesListeMaxForGroupKey(groupKey)
  return Math.max(cap, candidatCount)
}

/** Candidats max. pour une catégorie au sein de son groupe (ex. A1 limité par 10 − candidats A). */
export function maxCandidatsForListeGroupRow<
  T extends { code: string; candidats: number; enabled?: boolean },
>(rows: T[], rowCode: string): number {
  const row = rows.find((r) => r.code.toUpperCase() === rowCode.toUpperCase())
  if (!row || row.enabled === false) return 0
  const gk = listeExamenGroupKey(row.code)
  const groupMax = placesListeMaxForGroupKey(gk)
  const used = rows
    .filter(
      (r) =>
        r.enabled !== false &&
        r.code.toUpperCase() !== rowCode.toUpperCase() &&
        listeExamenGroupKey(r.code) === gk,
    )
    .reduce((n, r) => n + Math.max(0, Math.round(Number(r.candidats) || 0)), 0)
  return Math.max(0, groupMax - used)
}

/** @deprecated Préférer placesListeMaxForGroupKey */
export function placesListeBySectionIndex(sectionIndex: number): number {
  if (sectionIndex <= 0) return LISTE_EXAMEN_PLACES_REGLEMENT.groupeB
  if (sectionIndex === 1) return LISTE_EXAMEN_PLACES_REGLEMENT.groupeA
  return LISTE_EXAMEN_PLACES_REGLEMENT.autres
}
