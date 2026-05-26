import { categoriePermisArLabel } from "@/lib/api/categories-permis"
import type { CategoriePermisEcole } from "@prisma/client"
import type { PrismaDb } from "@/lib/prisma"
import { ApiError } from "@/lib/api/errors"

export function parseMoniteurCategoriePermisId(raw: unknown): string | null {
  const s = String(raw ?? "").trim()
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

export function moniteurCategorieArLabel(
  cat: Pick<CategoriePermisEcole, "libelleAr" | "code"> | null | undefined,
): string {
  return categoriePermisArLabel(cat)
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
      include: { categoriePermis: true },
    })
    if (!m) {
      throw new Error(`Moniteur ${slot} introuvable ou inactif.`)
    }
    return {
      nom: displayMoniteurNomComplet(m),
      categorie: moniteurCategorieArLabel(m.categoriePermis),
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
  actif?: boolean
}): string {
  const name = displayMoniteurNomComplet(input)
  const catCode = input.categoriePermis?.code ?? "—"
  const catAr = moniteurCategorieArLabel(input.categoriePermis ?? null)
  const inactive = input.actif === false ? " (inactif)" : ""
  return `${name} — ${catCode} (${catAr})${inactive}`
}
