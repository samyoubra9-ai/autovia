import {
  moniteurCategoriesCodes,
  orderedMoniteurCategories,
  type MoniteurWithCategories,
} from "@/lib/api/moniteur"
import type { CategoriePermisEcole, Moniteur } from "@prisma/client"

export type VehiculeDto = {
  id: string
  type: string
  marque: string
  modele: string
  matricule: string | null
  assuranceExpiration: string | null
  controleTechniqueExpiration: string | null
  createdAt: string
}

export type MoniteurDto = {
  id: string
  nom: string
  prenom: string
  nomAr: string | null
  prenomAr: string | null
  estPrincipal: boolean
  categoriePermisId: string | null
  categoriePermisCode: string | null
  categoriesPermisIds: string[]
  categoriesPermisCodes: string[]
  telephone: string | null
  numeroCarteMoniteur: string | null
  dateFinContrat: string | null
  actif: boolean
  createdAt: string
}

type MoniteurWithCat = Moniteur & {
  categoriePermis?: CategoriePermisEcole | null
  categoriesEnseignees?: { categoriePermis: CategoriePermisEcole }[]
}

export function toVehiculeDto(v: {
  id: string
  type: string
  marque: string
  modele: string
  matricule: string | null
  assuranceExpiration: Date | null
  controleTechniqueExpiration: Date | null
  createdAt: Date
}): VehiculeDto | null {
  try {
    if (!v?.id) return null
    return {
      id: v.id,
      type: v.type,
      marque: v.marque,
      modele: v.modele,
      matricule: v.matricule ?? null,
      assuranceExpiration: v.assuranceExpiration?.toISOString() ?? null,
      controleTechniqueExpiration: v.controleTechniqueExpiration?.toISOString() ?? null,
      createdAt: v.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function toMoniteurDto(m: MoniteurWithCat): MoniteurDto | null {
  try {
    if (!m?.id) return null
    const withCats = m as MoniteurWithCategories
    const codes = moniteurCategoriesCodes(withCats)
    const cats = orderedMoniteurCategories(withCats)
    const primaryId = cats[0]?.id ?? m.categoriePermisId ?? null
    return {
      id: m.id,
      nom: m.nom,
      prenom: m.prenom,
      nomAr: m.nomAr?.trim() || null,
      prenomAr: m.prenomAr?.trim() || null,
      estPrincipal: m.estPrincipal ?? false,
      categoriePermisId: primaryId,
      categoriePermisCode: codes.length > 0 ? codes.join(", ") : (m.categoriePermis?.code ?? null),
      categoriesPermisIds: cats.map((c) => c.id),
      categoriesPermisCodes: codes,
      telephone: m.telephone ?? null,
      numeroCarteMoniteur: m.numeroCarteMoniteur?.trim() || null,
      dateFinContrat: m.dateFinContrat?.toISOString() ?? null,
      actif: m.actif ?? true,
      createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}
