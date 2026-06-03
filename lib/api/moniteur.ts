import { categoriePermisArLabel } from "@/lib/api/categories-permis"
import type { CategoriePermisEcole } from "@prisma/client"
import type { PrismaDb } from "@/lib/prisma"
import { ApiError } from "@/lib/api/errors"

export const moniteurCategoriesInclude = {
  categoriePermis: true,
  categoriesEnseignees: {
    include: { categoriePermis: true },
    orderBy: { categoriePermis: { ordre: "asc" as const } },
  },
} as const

export type MoniteurWithCategories = {
  id: string
  estPrincipal: boolean
  categoriePermisId: string | null
  categoriePermis?: CategoriePermisEcole | null
  categoriesEnseignees?: {
    categoriePermis: CategoriePermisEcole
  }[]
}

export function parseMoniteurCategoriePermisId(raw: unknown): string | null {
  const s = String(raw ?? "").trim()
  return s || null
}

export function parseEstPrincipal(raw: unknown): boolean {
  return raw === true || raw === "true"
}

export function parseCategoriesPermisIds(
  body: Record<string, unknown>,
): string[] | undefined {
  if (body.categoriesPermisIds !== undefined) {
    if (!Array.isArray(body.categoriesPermisIds)) {
      throw new ApiError(400, "Liste de catégories invalide.")
    }
    const ids = body.categoriesPermisIds
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
    return [...new Set(ids)]
  }
  if (body.categoriePermisId !== undefined || body.categoriePermis !== undefined) {
    const single = parseMoniteurCategoriePermisId(
      body.categoriePermisId ?? body.categoriePermis,
    )
    return single ? [single] : []
  }
  return undefined
}

export function parseOptionalMoniteurDateFinContrat(raw: unknown): Date | null {
  if (raw === undefined || raw === null || raw === "") return null
  const d = new Date(String(raw))
  if (Number.isNaN(d.getTime())) {
    throw new ApiError(400, "Date de fin de contrat invalide.")
  }
  return d
}

export function parseOptionalNumeroCarteMoniteur(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  const s = String(raw).trim()
  return s || null
}

export async function assertMoniteurCategorieForTenant(
  prisma: PrismaDb,
  autoEcoleId: string,
  categoriePermisId: string | null,
): Promise<string | null> {
  if (!categoriePermisId) return null
  const row = await prisma.categoriePermisEcole.findFirst({
    where: { id: categoriePermisId, autoEcoleId, actif: true },
  })
  if (!row) {
    throw new ApiError(400, "Catégorie de permis invalide pour ce moniteur.")
  }
  return row.id
}

export async function assertCategoriesPermisForMoniteur(
  prisma: PrismaDb,
  autoEcoleId: string,
  ids: string[],
  estPrincipal: boolean,
): Promise<string[]> {
  if (ids.length === 0) {
    throw new ApiError(400, "Au moins une catégorie enseignée est requise.")
  }
  if (!estPrincipal && ids.length > 1) {
    throw new ApiError(
      400,
      "Seul le moniteur principal peut enseigner plusieurs catégories.",
    )
  }
  const unique = [...new Set(ids)]
  for (const id of unique) {
    await assertMoniteurCategorieForTenant(prisma, autoEcoleId, id)
  }
  return unique
}

export async function assertUniqueMoniteurPrincipal(
  prisma: PrismaDb,
  autoEcoleId: string,
  moniteurId: string,
  estPrincipal: boolean,
): Promise<void> {
  if (!estPrincipal) return
  const other = await prisma.moniteur.findFirst({
    where: {
      autoEcoleId,
      estPrincipal: true,
      id: { not: moniteurId },
    },
    select: { id: true, nom: true, prenom: true },
  })
  if (other) {
    throw new ApiError(
      409,
      `Un moniteur principal existe déjà (${other.prenom} ${other.nom}). Désignez-le comme moniteur standard avant d'en nommer un autre.`,
    )
  }
}

export async function syncMoniteurCategories(
  prisma: PrismaDb,
  moniteurId: string,
  categoriePermisIds: string[],
): Promise<void> {
  try {
    await prisma.moniteurCategoriePermis.deleteMany({ where: { moniteurId } })
    if (categoriePermisIds.length === 0) return
    await prisma.moniteurCategoriePermis.createMany({
      data: categoriePermisIds.map((categoriePermisId) => ({
        moniteurId,
        categoriePermisId,
      })),
      skipDuplicates: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/moniteur_categories_permis|does not exist|42P01/i.test(msg)) {
      throw new ApiError(
        503,
        "Base de données production non à jour : exécutez la migration moniteur principal (docs/sql/moniteur-principal-prod.sql sur Supabase), puis redéployez l’API.",
      )
    }
    throw err
  }
}

export function orderedMoniteurCategories(
  m: MoniteurWithCategories,
): CategoriePermisEcole[] {
  const fromPivot =
    m.categoriesEnseignees?.map((r) => r.categoriePermis).filter(Boolean) ?? []
  if (fromPivot.length > 0) return fromPivot
  return m.categoriePermis ? [m.categoriePermis] : []
}

export function moniteurCategoriesCodes(m: MoniteurWithCategories): string[] {
  return orderedMoniteurCategories(m).map((c) => c.code)
}

export function moniteurCategorieArLabel(
  cat: Pick<CategoriePermisEcole, "libelleAr" | "code"> | null | undefined,
): string {
  return categoriePermisArLabel(cat)
}

export function moniteurListeCategorieLabel(m: MoniteurWithCategories): string {
  const cats = orderedMoniteurCategories(m)
  if (cats.length === 0) return "—"
  return cats.map((c) => moniteurCategorieArLabel(c)).join(" / ")
}

export function displayMoniteurNomComplet(input: {
  nom: string
  prenom: string
  nomAr?: string | null
  prenomAr?: string | null
}): string {
  const ar = `${input.nomAr?.trim() ?? ""} ${input.prenomAr?.trim() ?? ""}`.trim()
  if (ar) return ar
  return `${input.nom} ${input.prenom}`.trim()
}

export async function resolveMoniteurListeSlot(
  prisma: PrismaDb,
  autoEcoleId: string,
  body: Record<string, unknown>,
  slot: 1 | 2,
): Promise<{ nom: string | null; categorie: string | null }> {
  const idKey = slot === 1 ? "moniteur1Id" : "moniteur2Id"
  const nomKey = slot === 1 ? "moniteur1Nom" : "moniteur2Nom"
  const catKey = slot === 1 ? "moniteur1Categorie" : "moniteur2Categorie"
  const id = String(body[idKey] ?? "").trim()

  if (id) {
    const m = await prisma.moniteur.findFirst({
      where: { id, autoEcoleId, actif: true },
      include: moniteurCategoriesInclude,
    })
    if (!m) {
      throw new Error(`Moniteur ${slot} introuvable ou inactif.`)
    }
    return {
      nom: displayMoniteurNomComplet(m),
      categorie: moniteurListeCategorieLabel(m),
    }
  }

  return {
    nom: String(body[nomKey] ?? "").trim() || null,
    categorie: String(body[catKey] ?? "").trim() || null,
  }
}

export function displayMoniteurLabel(input: {
  nom: string
  prenom: string
  nomAr?: string | null
  prenomAr?: string | null
  categoriePermis?: Pick<CategoriePermisEcole, "code" | "libelleFr" | "libelleAr"> | null
  categoriesCodes?: string[]
  estPrincipal?: boolean
  actif?: boolean
}): string {
  const name = displayMoniteurNomComplet(input)
  const codes =
    input.categoriesCodes?.length
      ? input.categoriesCodes.join(", ")
      : (input.categoriePermis?.code ?? "—")
  const catAr = input.categoriePermis
    ? moniteurCategorieArLabel(input.categoriePermis)
    : "—"
  const principal = input.estPrincipal ? " · Principal" : ""
  const inactive = input.actif === false ? " (inactif)" : ""
  return `${name} — ${codes} (${catAr})${principal}${inactive}`
}
