import { getProgressPercent } from "@/lib/api/formation"
import { resolveDisplayStatut, type SeanceWithRelations } from "@/lib/api/seances"
import type { SeanceStatut, SeanceType } from "@prisma/client"

export type SeanceExamenDto = {
  id: string
  eleveId: string
  moniteurId: string | null
  vehiculeId: string | null
  type: SeanceType
  dateHeure: string
  statut: SeanceStatut
  statutAffichage: SeanceStatut
  notes: string | null
  messageCandidat: string | null
  createdAt: string
  updatedAt: string
  eleve: {
    id: string
    identifiant: string
    prenom: string
    nom: string
    categoriePermis: string
  }
  moniteur: { id: string; prenom: string; nom: string } | null
  vehicule: {
    id: string
    marque: string
    modele: string
    matricule: string | null
  } | null
}

type SeanceRow = SeanceWithRelations & {
  statut?: SeanceStatut
  type?: SeanceType
  moniteurId?: string | null
  vehiculeId?: string | null
  moniteur?: SeanceExamenDto["moniteur"]
  vehicule?: SeanceExamenDto["vehicule"]
}

export function toSeanceExamenDto(row: SeanceRow): SeanceExamenDto | null {
  try {
    if (!row?.id || !row.eleveId) return null
    const dateHeure =
      row.dateHeure instanceof Date && !Number.isNaN(row.dateHeure.getTime())
        ? row.dateHeure
        : new Date()
    const statut = row.statut ?? "planifie"
    const statutAffichage = resolveDisplayStatut(statut, dateHeure)
    const eleve = row.eleve
    if (!eleve?.id) return null
    return {
      id: row.id,
      eleveId: row.eleveId,
      moniteurId: row.moniteurId ?? null,
      vehiculeId: row.vehiculeId ?? null,
      type: row.type ?? "code",
      dateHeure: dateHeure.toISOString(),
      statut,
      statutAffichage,
      notes: row.notes ?? null,
      messageCandidat:
        (row as { messageCandidat?: string | null }).messageCandidat ?? null,
      createdAt: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      eleve: {
        id: eleve.id,
        identifiant: eleve.identifiant ?? "",
        prenom: eleve.prenom ?? "",
        nom: eleve.nom ?? "",
        categoriePermis: String(
          (eleve as { categoriePermis?: { code?: string } }).categoriePermis?.code ?? "",
        ),
      },
      moniteur: row.moniteur ?? null,
      vehicule: row.vehicule ?? null,
    }
  } catch (error) {
    console.warn("[toSeanceExamenDto] skip", error)
    return null
  }
}

export { getProgressPercent }
