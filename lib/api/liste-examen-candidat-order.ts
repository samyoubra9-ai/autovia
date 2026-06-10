import {
  listeExamenGroupKey,
  listeExamenGroupSortRank,
} from "@/lib/api/liste-examen-groups"
import type { NatureExamenListe } from "@prisma/client"

export type ListeExamenCandidatOrderFields = {
  natureExamen: string
  sansDossier?: boolean
  numeroDossier?: string | null
  ordre?: number
}

export function candidatListeSansDossier(c: ListeExamenCandidatOrderFields): boolean {
  if (c.sansDossier === true) return true
  if (c.sansDossier === false) return false
  const d = c.numeroDossier?.trim() ?? ""
  return !d
}

/**
 * Ordre d'affichage dans une catégorie :
 * 1. Code sans numéro de dossier
 * 2. Code avec dossier
 * 3. Créneau
 * 4. Circulation
 */
export function listeExamenCandidatDisplayBucket(c: ListeExamenCandidatOrderFields): number {
  const nature = c.natureExamen
  if (nature === "code" && candidatListeSansDossier(c)) return 0
  if (nature === "code") return 1
  if (nature === "creneau") return 2
  if (nature === "circulation") return 3
  return 99
}

export function compareListeExamenCandidatsWithinCategory(
  a: ListeExamenCandidatOrderFields,
  b: ListeExamenCandidatOrderFields,
): number {
  const bucket = listeExamenCandidatDisplayBucket(a) - listeExamenCandidatDisplayBucket(b)
  if (bucket !== 0) return bucket
  return (a.ordre ?? 0) - (b.ordre ?? 0)
}

export function sortCandidatsWithinCategory<T extends ListeExamenCandidatOrderFields>(
  items: T[],
): T[] {
  return [...items].sort(compareListeExamenCandidatsWithinCategory)
}

export type ListeExamenCandidatDisplayRow = ListeExamenCandidatOrderFields & {
  categoriePermisId?: string
  categorieCode?: string
}

/** Tri complet : catégorie officielle (B, A, C…) puis règles par catégorie. */
export function compareListeExamenCandidatsForDisplay(
  a: ListeExamenCandidatDisplayRow,
  b: ListeExamenCandidatDisplayRow,
): number {
  const ga = listeExamenGroupKey(a.categorieCode ?? "")
  const gb = listeExamenGroupKey(b.categorieCode ?? "")
  const catRank =
    listeExamenGroupSortRank(ga) - listeExamenGroupSortRank(gb) || ga.localeCompare(gb)
  if (catRank !== 0) return catRank

  const permis = (a.categorieCode ?? "").localeCompare(b.categorieCode ?? "")
  if (permis !== 0) return permis

  return compareListeExamenCandidatsWithinCategory(a, b)
}

export function sortCandidatsForListeDisplay<T extends ListeExamenCandidatDisplayRow>(
  items: T[],
): T[] {
  return [...items].sort(compareListeExamenCandidatsForDisplay)
}

export type BuiltCandidatRow = {
  eleveId: string
  categoriePermisId: string
  ordre: number
  natureExamen: NatureExamenListe
  dateDernierExamen: Date | null
}

/** Réassigne `ordre` 1…n par catégorie selon les règles d'affichage (création liste). */
export function assignOrdreOnBuiltCandidatRows(
  rows: BuiltCandidatRow[],
  numeroDossierByEleveId: Map<string, string | null | undefined>,
): BuiltCandidatRow[] {
  const byCat = new Map<string, BuiltCandidatRow[]>()
  for (const row of rows) {
    const list = byCat.get(row.categoriePermisId) ?? []
    list.push(row)
    byCat.set(row.categoriePermisId, list)
  }

  const out: BuiltCandidatRow[] = []
  for (const group of byCat.values()) {
    const sorted = sortCandidatsWithinCategory(
      group.map((row) => ({
        ...row,
        sansDossier: !numeroDossierByEleveId.get(row.eleveId)?.trim(),
      })),
    )
    sorted.forEach((row, index) => {
      out.push({ ...row, ordre: index + 1 })
    })
  }
  return out
}
