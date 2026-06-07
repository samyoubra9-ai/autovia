import { ApiError } from "@/lib/api/errors"
import { parseListeDateOnly, parseOptionalListeDateOnly } from "@/lib/api/liste-examen"

export const LISTE_EXAMEN_HEADER_PATCH_KEYS = [
  "centreExamen",
  "wilaya",
  "dateDepot",
  "dateExamen",
  "inspecteurNom",
  "moniteur1Nom",
  "moniteur1Categorie",
  "moniteur2Nom",
  "moniteur2Categorie",
  "ecoleNomAr",
  "ecoleAdresse",
  "ecoleRegistre",
  "ecoleTelephone",
  "referenceEnvoi",
  "lieuRedaction",
] as const

export type ListeExamenHeaderCreate = {
  centreExamen: string
  wilaya: string
  dateDepot: Date
  dateExamen: Date
  inspecteurNom: string | null
  moniteur1Nom: string | null
  moniteur1Categorie: string | null
  moniteur2Nom: string | null
  moniteur2Categorie: string | null
  ecoleNomAr: string | null
  ecoleAdresse: string | null
  ecoleRegistre: string | null
  ecoleTelephone: string | null
  referenceEnvoi: string | null
  lieuRedaction: string | null
  statut: "brouillon" | "validee"
}

export type ListeExamenHeaderPatch = Partial<
  Omit<ListeExamenHeaderCreate, "statut">
>

function parseOptionalText(value: unknown): string | null {
  const s = String(value ?? "").trim()
  return s || null
}

export function hasListeExamenHeaderPatch(body: Record<string, unknown>): boolean {
  return LISTE_EXAMEN_HEADER_PATCH_KEYS.some((key) => key in body)
}

export function parseListeExamenHeaderCreate(
  body: Record<string, unknown>,
): ListeExamenHeaderCreate {
  const centreExamen = String(body.centreExamen ?? "").trim()
  const wilaya = String(body.wilaya ?? "").trim()
  if (!centreExamen) throw new ApiError(400, "Centre d'examen requis.")
  if (!wilaya) throw new ApiError(400, "Wilaya requise.")

  return {
    centreExamen,
    wilaya,
    dateDepot: parseListeDateOnly(body.dateDepot, "Date de dépôt"),
    dateExamen: parseListeDateOnly(body.dateExamen, "Date d'examen"),
    inspecteurNom: parseOptionalText(body.inspecteurNom),
    moniteur1Nom: parseOptionalText(body.moniteur1Nom),
    moniteur1Categorie: parseOptionalText(body.moniteur1Categorie),
    moniteur2Nom: parseOptionalText(body.moniteur2Nom),
    moniteur2Categorie: parseOptionalText(body.moniteur2Categorie),
    ecoleNomAr: parseOptionalText(body.ecoleNomAr),
    ecoleAdresse: parseOptionalText(body.ecoleAdresse),
    ecoleRegistre: parseOptionalText(body.ecoleRegistre),
    ecoleTelephone: parseOptionalText(body.ecoleTelephone),
    referenceEnvoi: parseOptionalText(body.referenceEnvoi),
    lieuRedaction: parseOptionalText(body.lieuRedaction),
    statut: body.statut === "validee" ? "validee" : "brouillon",
  }
}

export function parseListeExamenHeaderPatch(
  body: Record<string, unknown>,
): ListeExamenHeaderPatch {
  const patch: ListeExamenHeaderPatch = {}

  if ("centreExamen" in body) {
    const centreExamen = String(body.centreExamen ?? "").trim()
    if (!centreExamen) throw new ApiError(400, "Centre d'examen requis.")
    patch.centreExamen = centreExamen
  }

  if ("wilaya" in body) {
    const wilaya = String(body.wilaya ?? "").trim()
    if (!wilaya) throw new ApiError(400, "Wilaya requise.")
    patch.wilaya = wilaya
  }

  if ("dateDepot" in body) {
    patch.dateDepot = parseListeDateOnly(body.dateDepot, "Date de dépôt")
  }

  if ("dateExamen" in body) {
    patch.dateExamen = parseListeDateOnly(body.dateExamen, "Date d'examen")
  }

  if ("inspecteurNom" in body) patch.inspecteurNom = parseOptionalText(body.inspecteurNom)
  if ("moniteur1Nom" in body) patch.moniteur1Nom = parseOptionalText(body.moniteur1Nom)
  if ("moniteur1Categorie" in body) {
    patch.moniteur1Categorie = parseOptionalText(body.moniteur1Categorie)
  }
  if ("moniteur2Nom" in body) patch.moniteur2Nom = parseOptionalText(body.moniteur2Nom)
  if ("moniteur2Categorie" in body) {
    patch.moniteur2Categorie = parseOptionalText(body.moniteur2Categorie)
  }
  if ("ecoleNomAr" in body) patch.ecoleNomAr = parseOptionalText(body.ecoleNomAr)
  if ("ecoleAdresse" in body) patch.ecoleAdresse = parseOptionalText(body.ecoleAdresse)
  if ("ecoleRegistre" in body) patch.ecoleRegistre = parseOptionalText(body.ecoleRegistre)
  if ("ecoleTelephone" in body) patch.ecoleTelephone = parseOptionalText(body.ecoleTelephone)
  if ("referenceEnvoi" in body) patch.referenceEnvoi = parseOptionalText(body.referenceEnvoi)
  if ("lieuRedaction" in body) patch.lieuRedaction = parseOptionalText(body.lieuRedaction)

  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, "Aucune modification d'en-tête.")
  }

  return patch
}

export { parseOptionalListeDateOnly }
