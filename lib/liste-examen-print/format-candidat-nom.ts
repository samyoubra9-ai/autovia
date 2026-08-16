export type CandidatNomParts = {
  nom: string
  prenom: string
}

/** اللقب puis الاسم — nom de famille en premier dans la cellule. */
export function candidatNomPartsFromEleve(input: {
  nom: string
  prenom: string
  nomAr?: string | null
  prenomAr?: string | null
}): CandidatNomParts {
  const nom = (input.nomAr?.trim() || input.nom?.trim() || "").trim()
  const prenom = (input.prenomAr?.trim() || input.prenom?.trim() || "").trim()
  return { nom, prenom }
}

export function formatCandidatNomLabel(parts: CandidatNomParts): string {
  const { nom, prenom } = parts
  if (nom && prenom) return `${nom} ${prenom}`
  return nom || prenom
}
