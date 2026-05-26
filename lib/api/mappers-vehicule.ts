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
  categoriePermisId: string | null
  categoriePermisCode: string | null
  telephone: string | null
  actif: boolean
  createdAt: string
}

type MoniteurWithCat = Moniteur & { categoriePermis?: CategoriePermisEcole | null }

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
    return {
      id: m.id,
      nom: m.nom,
      prenom: m.prenom,
      nomAr: m.nomAr?.trim() || null,
      prenomAr: m.prenomAr?.trim() || null,
      categoriePermisId: m.categoriePermisId ?? null,
      categoriePermisCode: m.categoriePermis?.code ?? null,
      telephone: m.telephone ?? null,
      actif: m.actif ?? true,
      createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}
