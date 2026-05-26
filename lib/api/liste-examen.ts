import { categoriePermisArLabel } from "@/lib/api/categories-permis"
import { listeExamenGroupKey } from "@/lib/api/liste-examen-groups"
import type { CategoriePermisEcole, Eleve, NatureExamenListe } from "@prisma/client"
import { ApiError } from "@/lib/api/errors"

export const NATURE_EXAMEN_AR: Record<NatureExamenListe, string> = {
  code: "قانون المرور",
  creneau: "المناورات",
  circulation: "السياقة",
}

export { categoriePermisArLabel }

export function natureFromStatut(
  statut: "code" | "creneau" | "circulation",
): NatureExamenListe {
  return statut
}

export function calculateAgeAt(dateNaissance: Date, at: Date): number {
  let age = at.getFullYear() - dateNaissance.getFullYear()
  const m = at.getMonth() - dateNaissance.getMonth()
  if (m < 0 || (m === 0 && at.getDate() < dateNaissance.getDate())) age--
  return age
}

export function isEligibleForCirculation(
  eleve: Eleve,
  dateExamen: Date,
  ageMin = 18,
): boolean {
  return calculateAgeAt(eleve.dateNaissance, dateExamen) >= ageMin
}

export function formatDateListe(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

export type CandidatInput = {
  eleveId: string
  natureExamen: NatureExamenListe
  dateDernierExamen?: string | null
}

export function validateCandidatsLimits(
  candidats: { categoriePermisId: string }[],
  categoriesById: Map<
    string,
    Pick<CategoriePermisEcole, "placesListe" | "code" | "actif" | "surListeExamen">
  >,
): void {
  const counts = new Map<string, number>()
  for (const c of candidats) {
    const cat = categoriesById.get(c.categoriePermisId)
    if (!cat) {
      throw new ApiError(400, "Catégorie de permis introuvable pour un candidat.")
    }
    const gk = listeExamenGroupKey(cat.code)
    counts.set(gk, (counts.get(gk) ?? 0) + 1)
  }
  const allCats = [...categoriesById.values()]
  for (const [gk, count] of counts) {
    const catsInGroup = allCats.filter((c) => listeExamenGroupKey(c.code) === gk)
    if (catsInGroup.length === 0) continue
    const inactive = catsInGroup.find((c) => !c.actif)
    if (inactive) {
      throw new ApiError(400, `La catégorie « ${inactive.code} » est inactive.`)
    }
    const maxPlaces = Math.max(...catsInGroup.map((c) => c.placesListe))
    const label = gk === "A" ? "A / A1" : gk
    if (count > maxPlaces) {
      throw new ApiError(
        400,
        `Maximum ${maxPlaces} candidat(s) pour la catégorie ${label} (liste d'examen).`,
      )
    }
  }
}

export function countStatsByNature(candidats: { natureExamen: NatureExamenListe }[]) {
  return {
    code: candidats.filter((c) => c.natureExamen === "code").length,
    creneau: candidats.filter((c) => c.natureExamen === "creneau").length,
    circulation: candidats.filter((c) => c.natureExamen === "circulation").length,
    total: candidats.length,
  }
}
