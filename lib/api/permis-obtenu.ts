/** Catégories de permis déjà obtenues (ordre d'affichage officiel). */
export const CATEGORIES_PERMIS_OBTENUS = [
  "A1",
  "A",
  "B",
  "D",
  "C1",
  "C",
  "BE",
  "C1E",
  "CE",
  "DE",
] as const

export type CategoriePermisObtenu = (typeof CATEGORIES_PERMIS_OBTENUS)[number]

const SET = new Set<string>(CATEGORIES_PERMIS_OBTENUS)

export function parseCategoriesPermisObtenues(raw: unknown): CategoriePermisObtenu[] {
  if (!Array.isArray(raw)) return []
  const out: CategoriePermisObtenu[] = []
  for (const item of raw) {
    const code = String(item ?? "").trim().toUpperCase()
    if (SET.has(code) && !out.includes(code as CategoriePermisObtenu)) {
      out.push(code as CategoriePermisObtenu)
    }
  }
  return CATEGORIES_PERMIS_OBTENUS.filter((c) => out.includes(c))
}

export function formatCategoriesPermisObtenues(codes: string[]): string {
  return CATEGORIES_PERMIS_OBTENUS.filter((c) => codes.includes(c)).join(" - ")
}

export function permisObtenuPrismaFields(input: {
  permisDejaObtenu: boolean
  numeroPermisObtenu?: string | null
  datePermisObtenu?: string | null
  categoriesPermisObtenues: CategoriePermisObtenu[]
  permisDelivrePar?: string | null
}) {
  if (!input.permisDejaObtenu) {
    return {
      permisDejaObtenu: false,
      numeroPermisObtenu: null,
      datePermisObtenu: null,
      categoriesPermisObtenues: [] as string[],
      permisDelivrePar: null,
    }
  }
  const numero = input.numeroPermisObtenu?.trim() || null
  const delivrePar = input.permisDelivrePar?.trim() || null
  const dateRaw = input.datePermisObtenu?.trim()
  const datePermisObtenu = dateRaw ? new Date(dateRaw) : null
  if (datePermisObtenu && Number.isNaN(datePermisObtenu.getTime())) {
    throw new Error("Date d'obtention du permis invalide.")
  }
  const categories = input.categoriesPermisObtenues
  if (!numero) throw new Error("Le numéro de permis obtenu est requis.")
  if (!datePermisObtenu) throw new Error("La date d'obtention du permis est requise.")
  if (!delivrePar) throw new Error("Indiquez la mairie ou l'autorité de délivrance.")
  if (categories.length === 0) {
    throw new Error("Sélectionnez au moins une catégorie de permis déjà obtenue.")
  }
  return {
    permisDejaObtenu: true,
    numeroPermisObtenu: numero,
    datePermisObtenu,
    categoriesPermisObtenues: categories,
    permisDelivrePar: delivrePar,
  }
}
