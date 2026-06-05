import type { CategoriePermisEcole } from "@prisma/client"
import type { PrismaDb } from "@/lib/prisma"
import { ApiError } from "@/lib/api/errors"
import { listeExamenGroupKey, listeExamenGroupSortRank } from "@/lib/api/liste-examen-groups"
import { placesListeMaxForPermisCode } from "@/lib/liste-examen-places-reglement"

export type CategoriePermisDto = {
  id: string
  code: string
  libelleFr: string
  libelleAr: string | null
  placesListe: number
  surListeExamen: boolean
  prixPermis: number
  ordre: number
  actif: boolean
}

export const DEFAULT_PRIX_PERMIS = 25000

/** Catalogue national — ordre d'affichage (sélection élève, permis obtenu). */
export const DEFAULT_CATEGORIES: Array<{
  code: string
  libelleFr: string
  libelleAr: string
  placesListe: number
  prixPermis: number
  ordre: number
}> = [
  {
    code: "A1",
    libelleFr: "Catégorie A1",
    libelleAr: "صنف أ1",
    placesListe: 10,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 1,
  },
  {
    code: "A",
    libelleFr: "Catégorie A",
    libelleAr: "صنف أ",
    placesListe: 10,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 2,
  },
  {
    code: "B",
    libelleFr: "Catégorie B",
    libelleAr: "صنف ب",
    placesListe: 15,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 3,
  },
  {
    code: "D",
    libelleFr: "Catégorie D",
    libelleAr: "صنف د",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 4,
  },
  {
    code: "C1",
    libelleFr: "Catégorie C1",
    libelleAr: "صنف ج1",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 5,
  },
  {
    code: "C",
    libelleFr: "Catégorie C",
    libelleAr: "صنف ج",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 6,
  },
  {
    code: "BE",
    libelleFr: "Catégorie BE",
    libelleAr: "صنف ب ه",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 7,
  },
  {
    code: "C1E",
    libelleFr: "Catégorie C1E",
    libelleAr: "صنف ج1 ه",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 8,
  },
  {
    code: "CE",
    libelleFr: "Catégorie CE",
    libelleAr: "صنف ج ه",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 9,
  },
  {
    code: "DE",
    libelleFr: "Catégorie DE",
    libelleAr: "صنف د ه",
    placesListe: 5,
    prixPermis: DEFAULT_PRIX_PERMIS,
    ordre: 10,
  },
]

export function toCategoriePermisDto(row: CategoriePermisEcole): CategoriePermisDto {
  return {
    id: row.id,
    code: row.code,
    libelleFr: row.libelleFr,
    libelleAr: row.libelleAr,
    placesListe: row.placesListe,
    surListeExamen: row.surListeExamen,
    prixPermis: row.prixPermis,
    ordre: row.ordre,
    actif: row.actif,
  }
}

export function defaultOrdreForPermisCode(code: string): number {
  const upper = code.trim().toUpperCase()
  const found = DEFAULT_CATEGORIES.find((c) => c.code === upper)
  return found?.ordre ?? 99
}

export function sortCategoriesByOfficialOrder<T extends { code: string }>(cats: T[]): T[] {
  return [...cats].sort(
    (a, b) =>
      listeExamenGroupSortRank(listeExamenGroupKey(a.code)) -
        listeExamenGroupSortRank(listeExamenGroupKey(b.code)) ||
      a.code.localeCompare(b.code),
  )
}

export function catalogEntryForPermisCode(code: string) {
  const upper = code.trim().toUpperCase()
  const entry = DEFAULT_CATEGORIES.find((c) => c.code === upper)
  if (!entry) {
    throw new ApiError(
      400,
      `Catégorie « ${code} » inconnue. Choisissez une catégorie du catalogue officiel.`,
    )
  }
  return entry
}

function parsePrixPermis(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return DEFAULT_PRIX_PERMIS
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PRIX_PERMIS
  const prix = Math.round(n)
  if (prix > 10_000_000) {
    throw new ApiError(400, "Prix du forfait permis : maximum 10 000 000 DZD.")
  }
  return prix
}

export function parseCategoriePermisInput(body: unknown): {
  code: string
  libelleFr: string
  libelleAr: string | null
  placesListe: number
  surListeExamen: boolean
  prixPermis: number
  ordre: number
  actif: boolean
} {
  if (!body || typeof body !== "object") throw new ApiError(400, "Corps invalide.")
  const b = body as Record<string, unknown>
  const code = String(b.code ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
  if (!code || code.length > 12) {
    throw new ApiError(400, "Code catégorie requis (12 caractères max).")
  }
  const catalog = catalogEntryForPermisCode(code)
  const libelleFr = String(b.libelleFr ?? "").trim() || catalog.libelleFr
  const libelleAr = String(b.libelleAr ?? "").trim() || catalog.libelleAr
  return {
    code,
    libelleFr,
    libelleAr,
    placesListe: placesListeMaxForPermisCode(code),
    surListeExamen: b.surListeExamen !== false,
    prixPermis: parsePrixPermis(b.prixPermis),
    ordre: defaultOrdreForPermisCode(code),
    actif: b.actif !== false,
  }
}

export type OnboardingCategorieInput = {
  code: string
  libelleFr: string
  libelleAr: string | null
  placesListe: number
  surListeExamen: boolean
  prixPermis: number
  ordre: number
}

/** Catégories choisies à l'inscription (wizard backdash). */
export function parseOnboardingCategoriesInput(raw: unknown): OnboardingCategorieInput[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Ajoutez au moins une catégorie de permis.")
  }
  if (raw.length > 25) {
    throw new ApiError(400, "Maximum 25 catégories de permis.")
  }

  const byCode = new Map<string, OnboardingCategorieInput>()
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const code = String(o.code ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
    if (!code) continue

    const catalog = DEFAULT_CATEGORIES.find((c) => c.code === code)
    const libelleFr =
      String(o.libelleFr ?? "").trim() || catalog?.libelleFr || `Catégorie ${code}`
    const libelleAr = String(o.libelleAr ?? "").trim() || catalog?.libelleAr || null
    if (!catalog) {
      throw new ApiError(400, `Catégorie « ${code} » inconnue.`)
    }
    const parsed = {
      code,
      libelleFr,
      libelleAr,
      placesListe: placesListeMaxForPermisCode(code),
      surListeExamen: o.surListeExamen !== false,
      prixPermis: parsePrixPermis(o.prixPermis),
      ordre: defaultOrdreForPermisCode(code),
    }
    byCode.set(code, parsed)
  }

  const rows = [...byCode.values()].sort((a, b) => a.ordre - b.ordre)
  if (rows.length === 0) {
    throw new ApiError(400, "Ajoutez au moins une catégorie de permis valide.")
  }
  return rows
}

export async function createCategoriesPermisForAutoEcole(
  db: PrismaDb,
  autoEcoleId: string,
  categories: OnboardingCategorieInput[],
) {
  if (categories.length === 0) return
  await db.categoriePermisEcole.createMany({
    data: categories.map((c) => ({
      autoEcoleId,
      code: c.code,
      libelleFr: c.libelleFr,
      libelleAr: c.libelleAr,
      placesListe: c.placesListe,
      surListeExamen: c.surListeExamen,
      prixPermis: c.prixPermis,
      ordre: c.ordre,
      actif: true,
    })),
  })
}

export async function listCategoriesPermisForAutoEcole(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<CategoriePermisEcole[]> {
  return db.categoriePermisEcole.findMany({
    where: { autoEcoleId },
    orderBy: [{ ordre: "asc" }, { code: "asc" }],
  })
}

/** Liste les catégories de l'école (sans création automatique). */
export async function ensureDefaultCategoriesPermis(
  db: PrismaDb,
  autoEcoleId: string,
): Promise<CategoriePermisEcole[]> {
  return listCategoriesPermisForAutoEcole(db, autoEcoleId)
}

export async function assertCategoriePermisForTenant(
  db: PrismaDb,
  autoEcoleId: string,
  categoriePermisId: string,
): Promise<CategoriePermisEcole> {
  const row = await db.categoriePermisEcole.findFirst({
    where: { id: categoriePermisId, autoEcoleId, actif: true },
  })
  if (!row) {
    throw new ApiError(400, "Catégorie de permis invalide ou inactive.")
  }
  return row
}

export type EleveCategoriePermisEmbed = {
  id: string
  code: string
  libelleFr: string
  libelleAr: string | null
  placesListe: number
  surListeExamen: boolean
  prixPermis: number
}

export function embedCategoriePermis(
  row: CategoriePermisEcole | null | undefined,
): EleveCategoriePermisEmbed | null {
  if (!row) return null
  return {
    id: row.id,
    code: row.code,
    libelleFr: row.libelleFr,
    libelleAr: row.libelleAr,
    placesListe: row.placesListe,
    surListeExamen: row.surListeExamen,
    prixPermis: row.prixPermis,
  }
}

/** Prix enregistré sur l'élève : catégorie à l'inscription ou changement de catégorie */
export function resolvePrixPermisEleve(
  categorie: Pick<CategoriePermisEcole, "prixPermis">,
  existing?: { categoriePermisId: string; prixPermis: number } | null,
  newCategoriePermisId?: string,
): number {
  if (
    existing &&
    newCategoriePermisId &&
    existing.categoriePermisId === newCategoriePermisId
  ) {
    return existing.prixPermis
  }
  return categorie.prixPermis
}

/** Catégories actives présentes sur la liste d'examen, triées */
export function categoriesPourListeExamen(
  rows: CategoriePermisEcole[],
): CategoriePermisEcole[] {
  return rows
    .filter((c) => c.actif && c.surListeExamen)
    .sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code))
}

const PERMIS_CODE_AR_EXACT: Record<string, string> = {
  A: "أ",
  A1: "أ1",
  A2: "أ2",
  B: "ب",
  C: "ج",
  C1: "ج1",
  D: "د",
  E: "ه",
  BE: "به",
  C1E: "ج1ه",
  CE: "جه",
  DE: "ده",
}

const PERMIS_LETTER_AR: Record<string, string> = {
  A: "أ",
  B: "ب",
  C: "ج",
  D: "د",
  E: "ه",
}

const SANAF_PREFIX = /^صنف\s+/u
const ARABIC_RE = /[\u0600-\u06FF]/

export function permisCodeEnArabe(code: string): string {
  const raw = code.trim()
  if (!raw) return ""

  const sansSanaf = raw.replace(SANAF_PREFIX, "").trim()
  if (ARABIC_RE.test(sansSanaf)) return sansSanaf

  const upper = raw.toUpperCase()
  if (PERMIS_CODE_AR_EXACT[upper]) return PERMIS_CODE_AR_EXACT[upper]

  let out = ""
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i]
    const mapped = PERMIS_LETTER_AR[ch]
    if (mapped) out += mapped
    else if (/[0-9]/.test(ch)) out += ch
    else out += raw[i] ?? ch
  }
  return out || raw
}

export function categoriePermisArLabel(
  cat: Pick<CategoriePermisEcole, "libelleAr" | "code"> | null | undefined,
): string {
  if (!cat) return "—"
  const ar = cat.libelleAr?.trim()
  if (ar) return ar
  return cat.code
}

export function categoriePermisCodeAr(
  cat: Pick<CategoriePermisEcole, "libelleAr" | "code"> | null | undefined,
): string {
  if (!cat) return "—"
  const ar = cat.libelleAr?.trim()
  if (ar) {
    const stripped = ar.replace(SANAF_PREFIX, "").trim()
    if (stripped) return stripped
  }
  return permisCodeEnArabe(cat.code)
}
