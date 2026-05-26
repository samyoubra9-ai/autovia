import { ApiError } from "@/lib/api/errors"
import type { Eleve, StatutFormation } from "@prisma/client"

/** Étapes du parcours formation (côté moniteur / candidat). */
export const ETAPES_PARCOURS = ["code", "creneau", "circulation"] as const
export type EtapeParcours = (typeof ETAPES_PARCOURS)[number]

/** @deprecated Conservé pour compatibilité lecture DB — plus de promotion « examen ». */
export const ETAPES = [...ETAPES_PARCOURS, "examen"] as const

export function isParcoursTermine(
  eleve: Pick<Eleve, "etapeCirculationValidee">,
): boolean {
  return Boolean(eleve.etapeCirculationValidee)
}

export function getEtapesValidees(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
  > &
    Partial<Pick<Eleve, "etapeExamenValidee">>,
) {
  return {
    code: eleve.etapeCodeValidee,
    creneau: eleve.etapeCreneauValidee,
    circulation: eleve.etapeCirculationValidee,
    examen: eleve.etapeExamenValidee ?? false,
  }
}

export function getProgressPercent(eleve: Pick<
  Eleve,
  | "etapeCodeValidee"
  | "etapeCreneauValidee"
  | "etapeCirculationValidee"
>) {
  const v = getEtapesValidees(eleve)
  const done = ETAPES_PARCOURS.filter((e) => v[e]).length
  return Math.round((done / ETAPES_PARCOURS.length) * 100)
}

export function assertCanValidateEtape(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
  >,
  etape: EtapeParcours,
) {
  if (etape === "creneau" && !eleve.etapeCodeValidee) {
    throw new ApiError(400, "Validez d'abord l'étape Code de la route.")
  }
  if (etape === "circulation" && !eleve.etapeCreneauValidee) {
    throw new ApiError(400, "Validez d'abord l'étape Créneau.")
  }
}

export function assertStatutFormationAllowed(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
  >,
  statut: StatutFormation,
) {
  if (statut === "creneau" && !eleve.etapeCodeValidee) {
    throw new ApiError(400, "Impossible : l'étape Code n'est pas validée.")
  }
  if (statut === "circulation" && !eleve.etapeCreneauValidee) {
    throw new ApiError(400, "Impossible : l'étape Créneau n'est pas validée.")
  }
  if (statut === "valide" && !eleve.etapeCirculationValidee) {
    throw new ApiError(400, "Impossible : la circulation n'est pas encore validée.")
  }
}

export function etapeToPrismaField(etape: EtapeParcours) {
  const map = {
    code: "etapeCodeValidee",
    creneau: "etapeCreneauValidee",
    circulation: "etapeCirculationValidee",
  } as const
  return map[etape]
}

const ETAPE_LABELS: Record<EtapeParcours, string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
}

export function getEtapeLabel(etape: EtapeParcours) {
  return ETAPE_LABELS[etape]
}

/** Prochaine étape à valider (promotion), ou null si permis validé (circulation OK). */
export function getNextPromotableEtape(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
  >,
): EtapeParcours | null {
  if (!eleve.etapeCodeValidee) return "code"
  if (!eleve.etapeCreneauValidee) return "creneau"
  if (!eleve.etapeCirculationValidee) return "circulation"
  return null
}

/**
 * Éligibilité à une nature d'examen sur la liste officielle (sélection backdash).
 * « valide » = parcours moniteur terminé — le candidat peut encore être inscrit
 * à l'examen officiel de circulation.
 */
export function eleveMatchesListeExamenNature(
  eleve: Pick<Eleve, "statutFormation">,
  nature: EtapeParcours,
): boolean {
  if (nature === "code") return eleve.statutFormation === "code"
  if (nature === "creneau") return eleve.statutFormation === "creneau"
  return (
    eleve.statutFormation === "circulation" || eleve.statutFormation === "valide"
  )
}

/** Statut formation après validation d'une étape. */
export function statutAfterValidateEtape(
  etape: EtapeParcours,
  current: StatutFormation,
): StatutFormation {
  if (etape === "code") return "creneau"
  if (etape === "creneau") return "circulation"
  if (etape === "circulation") return "valide"
  return current
}

/** La séance peut déclencher une promotion si son type = prochaine étape à valider. */
export function canPromoteFromSeanceType(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
  >,
  seanceType: string,
): boolean {
  const next = getNextPromotableEtape(eleve)
  return next !== null && next === seanceType
}

/** Type de séance suggéré pour planifier (aligné sur la prochaine étape). */
export function suggestedSeanceTypeForEleve(
  eleve: Pick<
    Eleve,
    | "etapeCodeValidee"
    | "etapeCreneauValidee"
    | "etapeCirculationValidee"
    | "statutFormation"
  >,
): "code" | "creneau" | "circulation" {
  const next = getNextPromotableEtape(eleve)
  if (next === "code" || next === "creneau" || next === "circulation") return next
  if (eleve.statutFormation === "valide" || isParcoursTermine(eleve)) return "circulation"
  if (eleve.statutFormation === "code") return "code"
  if (eleve.statutFormation === "creneau") return "creneau"
  return "circulation"
}
