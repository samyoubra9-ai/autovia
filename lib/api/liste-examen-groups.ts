/** Clé de regroupement pour la liste d'examen officielle (A et A1 = même section). */
export function listeExamenGroupKey(code: string): string {
  const c = code.trim().toUpperCase()
  if (c === "A" || c === "A1") return "A"
  return c
}

/** Catégories semi-remorque (suffixe E) — liste d'impression séparée, 15 places. */
export const SEMI_REMORQUE_PERMIS_CODES = new Set(["BE", "CE", "DE", "C1E"])

export function isSemiRemorquePermisCode(code: string): boolean {
  return SEMI_REMORQUE_PERMIS_CODES.has(code.trim().toUpperCase())
}

export function isSemiRemorqueGroupKey(groupKey: string): boolean {
  return isSemiRemorquePermisCode(groupKey)
}

export type ListeExamenPrintVariant = "principal" | "semi-remorque"

export function candidatMatchesPrintVariant(
  categorieCode: string,
  variant: ListeExamenPrintVariant,
): boolean {
  const isE = isSemiRemorquePermisCode(categorieCode)
  return variant === "semi-remorque" ? isE : !isE
}

export function categoriesInListeGroup<T extends { code: string }>(
  categories: T[],
  groupKey: string,
): T[] {
  return categories.filter((c) => listeExamenGroupKey(c.code) === groupKey)
}

/** Rang officiel pour trier codes / sections (indépendant des paramètres école). */
const OFFICIAL_GROUP_RANK: Record<string, number> = {
  B: 0,
  A: 1,
  C: 10,
  C1: 11,
  D: 12,
  BE: 20,
  CE: 21,
  C1E: 22,
  DE: 23,
}

export function listeExamenGroupSortRank(groupKey: string): number {
  const gk = groupKey.trim().toUpperCase()
  return OFFICIAL_GROUP_RANK[gk] ?? 100 + gk.charCodeAt(0)
}

/** Ordre d'affichage des blocs : B, puis A (+A1), puis le reste (ordre officiel fixe). */
export function sortListeExamenGroupKeys(keys: string[]): string[] {
  return [...new Set(keys)].sort(
    (a, b) => listeExamenGroupSortRank(a) - listeExamenGroupSortRank(b) || a.localeCompare(b),
  )
}

/** Catégories présentes sur la liste (uniquement celles des candidats sélectionnés). */
export function categoriesUsedByListeCandidats<
  T extends { id: string; code: string },
>(
  categories: T[],
  candidats: Array<{ categoriePermisId?: string; categorieCode?: string }>,
): T[] {
  if (candidats.length === 0) return []

  const ids = new Set(
    candidats
      .map((c) => c.categoriePermisId)
      .filter((id): id is string => Boolean(id)),
  )
  const codes = new Set(
    candidats
      .map((c) => c.categorieCode?.trim().toUpperCase())
      .filter((code): code is string => Boolean(code)),
  )

  return categories
    .filter((cat) => ids.has(cat.id) || codes.has(cat.code.toUpperCase()))
    .sort(
      (a, b) =>
        listeExamenGroupSortRank(listeExamenGroupKey(a.code)) -
          listeExamenGroupSortRank(listeExamenGroupKey(b.code)) ||
        a.code.localeCompare(b.code),
    )
}

/** Blocs d'impression : une section par groupe de permis représenté parmi les candidats. */
export function listeExamenGroupKeysFromCandidats(
  candidats: Array<{ categoriePermisId?: string; categorieCode?: string }>,
  categories: Array<{ id: string; code: string }>,
): string[] {
  const cats = categoriesUsedByListeCandidats(categories, candidats)
  const keys = new Set<string>()
  for (const c of candidats) {
    const code =
      c.categorieCode?.trim() ||
      cats.find((x) => x.id === c.categoriePermisId)?.code ||
      ""
    if (code) keys.add(listeExamenGroupKey(code))
  }
  return sortListeExamenGroupKeys([...keys])
}
