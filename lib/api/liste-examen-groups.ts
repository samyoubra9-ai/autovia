/** Clé de regroupement pour la liste d'examen officielle (A et A1 = même section). */
export function listeExamenGroupKey(code: string): string {
  const c = code.trim().toUpperCase()
  if (c === "A" || c === "A1") return "A"
  return c
}

export function categoriesInListeGroup<T extends { code: string }>(
  categories: T[],
  groupKey: string,
): T[] {
  return categories.filter((c) => listeExamenGroupKey(c.code) === groupKey)
}

/** Ordre d'affichage des blocs : B, puis A (+A1), puis le reste par ordre catégorie. */
export function sortListeExamenGroupKeys(
  keys: string[],
  categories: { code: string; ordre: number }[],
): string[] {
  const minOrdre = (gk: string) => {
    const cats = categoriesInListeGroup(categories, gk)
    if (cats.length === 0) return 999
    return Math.min(...cats.map((c) => c.ordre))
  }
  const rank = (gk: string) => {
    if (gk === "B") return 0
    if (gk === "A") return 1
    return 2 + minOrdre(gk)
  }
  return [...new Set(keys)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** Catégories présentes sur la liste (uniquement celles des candidats sélectionnés). */
export function categoriesUsedByListeCandidats<
  T extends { id: string; code: string; ordre: number },
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
    .sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code))
}

/** Blocs d'impression : une section par groupe de permis représenté parmi les candidats. */
export function listeExamenGroupKeysFromCandidats(
  candidats: Array<{ categoriePermisId?: string; categorieCode?: string }>,
  categories: Array<{ id: string; code: string; ordre: number }>,
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
  return sortListeExamenGroupKeys([...keys], cats)
}
