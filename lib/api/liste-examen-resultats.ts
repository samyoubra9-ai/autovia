import type { Eleve, ListeExamenCandidat, NatureExamenListe } from "@prisma/client"
import type { ResultatExamenCandidat } from "@/lib/api/resultat-examen-candidat"
import { etapeToPrismaField, statutAfterValidateEtape } from "@/lib/api/formation"
import {
  eleveUpdateOnA1CodeAdmis,
  isA1Eleve,
} from "@/lib/api/permis-a1"
import { parseResultatExamen } from "@/lib/api/resultat-examen-candidat"

export type CandidatResultatUpdate = {
  candidatId: string
  resultat: ResultatExamenCandidat | null
}

export function parseCandidatsResultats(raw: unknown): CandidatResultatUpdate[] {
  if (!Array.isArray(raw)) {
    throw new Error("candidats doit être un tableau.")
  }
  return raw.map((item) => {
    const o = item as Record<string, unknown>
    const candidatId = String(o.candidatId ?? o.id ?? "").trim()
    if (!candidatId) throw new Error("candidatId requis.")
    return {
      candidatId,
      resultat: parseResultatExamen(o.resultat),
    }
  })
}

function etapeFromNature(nature: NatureExamenListe): "code" | "creneau" | "circulation" {
  return nature
}

/**
 * Promotion automatique après « admis » sur une liste d'examen officielle.
 * Valide l'étape correspondant à la nature (code / créneau / circulation)
 * et fait avancer le statut formation.
 */
export function eleveUpdateOnAdmis(
  eleve: Eleve & { categoriePermis?: { code: string } | null },
  nature: NatureExamenListe,
): Partial<Eleve> | null {
  if (isA1Eleve(eleve) && nature === "code") {
    const patch = eleveUpdateOnA1CodeAdmis()
    if (eleve.etapeCodeValidee && eleve.statutFormation === patch.statutFormation) {
      return null
    }
    return patch
  }

  const etape = etapeFromNature(nature)
  const field = etapeToPrismaField(etape)
  const nextStatut = statutAfterValidateEtape(etape, eleve.statutFormation, eleve)

  const patch: Partial<Eleve> = { [field]: true }

  if (eleve.statutFormation !== nextStatut) {
    patch.statutFormation = nextStatut
  }

  const stepWasPending = !eleve[field]
  const statutChanged = patch.statutFormation !== undefined

  if (!stepWasPending && !statutChanged) {
    return null
  }

  return patch
}

export function candidatDataOnResultat(
  resultat: ResultatExamenCandidat | null,
): Pick<ListeExamenCandidat, "resultat"> {
  return { resultat: resultat as string | null }
}
