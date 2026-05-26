import type { Eleve, StatutFormation } from "@prisma/client"

/**
 * À l'inscription (ou changement de statut), les étapes antérieures au statut
 * choisi sont considérées comme déjà validées.
 */
export function etapesValideesForStatut(statut: StatutFormation): Pick<
  Eleve,
  "etapeCodeValidee" | "etapeCreneauValidee" | "etapeCirculationValidee"
> {
  switch (statut) {
    case "creneau":
      return {
        etapeCodeValidee: true,
        etapeCreneauValidee: false,
        etapeCirculationValidee: false,
      }
    case "circulation":
      return {
        etapeCodeValidee: true,
        etapeCreneauValidee: true,
        etapeCirculationValidee: false,
      }
    case "valide":
      return {
        etapeCodeValidee: true,
        etapeCreneauValidee: true,
        etapeCirculationValidee: true,
      }
    default:
      return {
        etapeCodeValidee: false,
        etapeCreneauValidee: false,
        etapeCirculationValidee: false,
      }
  }
}
