import type { Eleve, NatureExamenListe, StatutFormation } from "@prisma/client"

export type EtapeParcoursA1 = "code" | "creneau" | "circulation"

export const A1_MIN_CONDUITE_AGE = 18

export function isA1PermisCode(code: string | null | undefined): boolean {
  return code?.trim().toUpperCase() === "A1"
}

export function permisCodeFromEleve(
  eleve: {
    categoriePermis?: { code: string } | null
    categorieCode?: string | null
  },
): string {
  return (eleve.categoriePermis?.code ?? eleve.categorieCode ?? "").trim()
}

export function isA1Eleve(
  eleve: {
    categoriePermis?: { code: string } | null
    categorieCode?: string | null
  },
): boolean {
  return isA1PermisCode(permisCodeFromEleve(eleve))
}

export function calculateAgeAt(dateNaissance: Date, at: Date): number {
  let age = at.getFullYear() - dateNaissance.getFullYear()
  const m = at.getMonth() - dateNaissance.getMonth()
  if (m < 0 || (m === 0 && at.getDate() < dateNaissance.getDate())) age--
  return age
}

/** Code A1 réussi — candidat « sorti » en attendant 18 ans pour la conduite. */
export function isA1CodePhaseComplete(
  eleve: Pick<Eleve, "etapeCodeValidee" | "etapeCreneauValidee" | "statutFormation">,
): boolean {
  return Boolean(
    eleve.etapeCodeValidee &&
      !eleve.etapeCreneauValidee &&
      eleve.statutFormation === "valide",
  )
}

export function isA1ConduiteEnCours(
  eleve: Pick<Eleve, "etapeCodeValidee" | "etapeCirculationValidee" | "statutFormation">,
): boolean {
  return Boolean(
    eleve.etapeCodeValidee &&
      !eleve.etapeCirculationValidee &&
      (eleve.statutFormation === "creneau" || eleve.statutFormation === "circulation"),
  )
}

export function canReprendreConduiteA1(
  eleve: Pick<Eleve, "dateNaissance" | "etapeCodeValidee" | "etapeCreneauValidee" | "statutFormation"> & {
    categoriePermis?: { code: string } | null
  },
  at: Date = new Date(),
): boolean {
  if (!isA1Eleve(eleve) || !isA1CodePhaseComplete(eleve)) return false
  return calculateAgeAt(eleve.dateNaissance, at) >= A1_MIN_CONDUITE_AGE
}

export function assertNatureExamenAllowedForPermis(
  permisCode: string,
  nature: NatureExamenListe,
  eleveLabel?: string,
): void {
  if (!isA1PermisCode(permisCode)) return
  if (nature !== "code") {
    const who = eleveLabel ? `${eleveLabel} : ` : ""
    throw new Error(
      `${who}permis A1 — seul l'examen « code » est autorisé (créneau et circulation après 18 ans).`,
    )
  }
}

export function eleveMatchesListeExamenNatureA1(
  eleve: Pick<Eleve, "statutFormation" | "etapeCodeValidee" | "etapeCreneauValidee">,
  nature: EtapeParcoursA1,
): boolean {
  if (isA1CodePhaseComplete(eleve)) return false

  if (!eleve.etapeCodeValidee) {
    return nature === "code" && eleve.statutFormation === "code"
  }

  if (nature === "code") return false
  if (nature === "creneau") return eleve.statutFormation === "creneau"
  return eleve.statutFormation === "circulation" || eleve.statutFormation === "valide"
}

export function statutAfterValidateEtapeA1(etape: EtapeParcoursA1): StatutFormation {
  if (etape === "code") return "valide"
  if (etape === "creneau") return "circulation"
  return "valide"
}

export function eleveUpdateOnA1CodeAdmis(): Pick<Eleve, "etapeCodeValidee" | "statutFormation"> {
  return {
    etapeCodeValidee: true,
    statutFormation: "valide",
  }
}

export function eleveUpdateOnReprendreConduiteA1(): Pick<Eleve, "statutFormation"> {
  return { statutFormation: "creneau" }
}

export function etapesValideesForStatutA1(
  statut: StatutFormation,
): Pick<Eleve, "etapeCodeValidee" | "etapeCreneauValidee" | "etapeCirculationValidee"> {
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
        etapeCreneauValidee: false,
        etapeCirculationValidee: false,
      }
    default:
      return {
        etapeCodeValidee: false,
        etapeCreneauValidee: false,
        etapeCirculationValidee: false,
      }
  }
}

export const A1_PERMIS_OBTENU_LABEL = "Permis A1 obtenu — parcours terminé"

export const A1_SUIVI_FELICITATIONS =
  "Félicitations ! Vous avez obtenu votre permis A1."

export const A1_SUIVI_MESSAGE_B_18_ANS =
  "Veuillez attendre vos 18 ans pour passer le permis B."

/** @deprecated utiliser A1_PERMIS_OBTENU_LABEL */
export const A1_CODE_PHASE_LABEL = A1_PERMIS_OBTENU_LABEL

export const A1_LISTE_EXAMEN_HINT =
  "Permis A1 : liste d'examen « code » uniquement. Après réussite, le parcours est clos."
