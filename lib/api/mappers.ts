import {
  formatCodeSuiviDisplay,
  getSuiviPublicUrl,
} from "@/lib/api/code-suivi"
import {
  embedCategoriePermis,
  type EleveCategoriePermisEmbed,
} from "@/lib/api/categories-permis"
import { elevePhotoPublicUrl } from "@/lib/api/eleve-photo"
import type { EleveRelationsIds } from "@/lib/api/eleve-relations"
import { displayMoniteurNomComplet } from "@/lib/api/moniteur"
import { getProgressPercent } from "@/lib/api/formation"
import { etapesValideesForStatut } from "@/lib/api/formation-sync"
import {
  parseCategoriesPermisObtenues,
  permisObtenuPrismaFields,
  type CategoriePermisObtenu,
} from "@/lib/api/permis-obtenu"
import type {
  CategoriePermisEcole,
  Eleve,
  GroupeSanguin,
  Paiement,
  Prisma,
  Sexe,
  SituationFamiliale,
  StatutFormation,
  StatutInscription,
} from "@prisma/client"

export type EleveWithCategorie = Eleve & {
  categoriePermis?: CategoriePermisEcole | null
  moniteur?: { nom: string; prenom: string; nomAr: string | null; prenomAr: string | null } | null
  vehicule?: { matricule: string | null } | null
}

export type EleveDto = {
  id: string
  identifiant: string
  telephone: string
  nom: string
  prenom: string
  nin: string
  dateNaissance: string
  lieuNaissance: string
  domicile: string | null
  sexe: Sexe
  groupeSanguin: string
  categoriePermisId: string
  categoriePermis: EleveCategoriePermisEmbed
  statutFormation: StatutFormation
  mairieEnregistrement: string | null
  nationalite: string
  prenomPere: string | null
  nomMere: string | null
  prenomMere: string | null
  nomJeuneFille: string | null
  situationFamiliale: SituationFamiliale
  situationProfessionnelle: string
  prixPermis: number
  etapeCodeValidee: boolean
  etapeCreneauValidee: boolean
  etapeCirculationValidee: boolean
  etapeExamenValidee: boolean
  progressionPercent: number
  age: number
  ageDetail: string
  codeSuivi: string | null
  codeSuiviDisplay: string | null
  suiviUrl: string | null
  numeroDossier: string | null
  dateDepotDwsr: string | null
  nomAr: string | null
  prenomAr: string | null
  photoUrl: string | null
  permisDejaObtenu: boolean
  numeroPermisObtenu: string | null
  datePermisObtenu: string | null
  categoriesPermisObtenues: CategoriePermisObtenu[]
  permisDelivrePar: string | null
  moniteurId: string | null
  vehiculeId: string | null
  moniteurLabel: string | null
  vehiculeMatricule: string | null
  createdAt: string
}

export type PaiementDto = {
  id: string
  eleveId: string
  montant: number
  moniteurNom: string
  createdAt: string
}

export const GROUPE_TO_CLIENT: Record<GroupeSanguin, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
}

export const GROUPE_FROM_CLIENT: Record<string, GroupeSanguin> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
}

export function calculateAge(dateNaissance: Date): number {
  return calculateAgeDetail(dateNaissance).years
}

export type AgeDetail = {
  years: number
  months: number
  label: string
}

/** Âge en années et mois (ex. « 16 ans et 5 mois »). */
export function calculateAgeDetail(dateNaissance: Date, at: Date = new Date()): AgeDetail {
  let years = at.getFullYear() - dateNaissance.getFullYear()
  let months = at.getMonth() - dateNaissance.getMonth()
  if (at.getDate() < dateNaissance.getDate()) months--
  if (months < 0) {
    years--
    months += 12
  }
  if (years < 0) {
    return { years: 0, months: 0, label: '—' }
  }
  const label =
    months === 0
      ? `${years} ans`
      : years === 0
        ? `${months} mois`
        : `${years} ans et ${months} mois`
  return { years, months, label }
}

export function toEleveDto(eleve: EleveWithCategorie): EleveDto | null {
  try {
    if (!eleve?.id) return null
    const catEmbed = embedCategoriePermis(eleve.categoriePermis)
    if (!catEmbed) return null
    const dateNaissance =
      eleve.dateNaissance instanceof Date && !Number.isNaN(eleve.dateNaissance.getTime())
        ? eleve.dateNaissance
        : new Date()
    return {
    id: eleve.id,
    identifiant: eleve.identifiant,
    telephone: eleve.telephone,
    nom: eleve.nom,
    prenom: eleve.prenom,
    nin: eleve.nin,
    dateNaissance: dateNaissance.toISOString(),
    lieuNaissance: eleve.lieuNaissance,
    domicile: eleve.domicile ?? null,
    sexe: eleve.sexe,
    groupeSanguin: GROUPE_TO_CLIENT[eleve.groupeSanguin] ?? String(eleve.groupeSanguin ?? ""),
    categoriePermisId: eleve.categoriePermisId,
    categoriePermis: catEmbed,
    statutFormation: eleve.statutFormation,
    mairieEnregistrement: eleve.mairieEnregistrement,
    nationalite: eleve.nationalite,
    prenomPere: eleve.prenomPere,
    nomMere: eleve.nomMere,
    prenomMere: eleve.prenomMere,
    nomJeuneFille: eleve.nomJeuneFille ?? null,
    situationFamiliale: eleve.situationFamiliale,
    situationProfessionnelle: eleve.situationProfessionnelle,
    prixPermis: eleve.prixPermis,
    etapeCodeValidee: "etapeCodeValidee" in eleve ? eleve.etapeCodeValidee : false,
    etapeCreneauValidee: "etapeCreneauValidee" in eleve ? eleve.etapeCreneauValidee : false,
    etapeCirculationValidee:
      "etapeCirculationValidee" in eleve ? eleve.etapeCirculationValidee : false,
    etapeExamenValidee: "etapeExamenValidee" in eleve ? eleve.etapeExamenValidee : false,
    progressionPercent:
      "etapeCodeValidee" in eleve ? getProgressPercent(eleve) : 0,
    age: calculateAge(dateNaissance),
    ageDetail: calculateAgeDetail(dateNaissance).label,
    codeSuivi: eleve.codeSuivi ?? null,
    codeSuiviDisplay: eleve.codeSuivi
      ? formatCodeSuiviDisplay(eleve.codeSuivi)
      : null,
    suiviUrl: eleve.codeSuivi ? getSuiviPublicUrl(eleve.codeSuivi) : null,
    numeroDossier: eleve.numeroDossier ?? null,
    dateDepotDwsr:
      "dateDepotDwsr" in eleve && eleve.dateDepotDwsr
        ? eleve.dateDepotDwsr instanceof Date
          ? eleve.dateDepotDwsr.toISOString().slice(0, 10)
          : String(eleve.dateDepotDwsr).slice(0, 10)
        : null,
    nomAr: eleve.nomAr ?? null,
    prenomAr: eleve.prenomAr ?? null,
    photoUrl: elevePhotoPublicUrl(
      "photoPath" in eleve ? eleve.photoPath : null,
      eleve.updatedAt,
    ),
    permisDejaObtenu: "permisDejaObtenu" in eleve ? eleve.permisDejaObtenu : false,
    numeroPermisObtenu:
      "numeroPermisObtenu" in eleve ? eleve.numeroPermisObtenu ?? null : null,
    datePermisObtenu:
      "datePermisObtenu" in eleve && eleve.datePermisObtenu
        ? eleve.datePermisObtenu instanceof Date
          ? eleve.datePermisObtenu.toISOString().slice(0, 10)
          : String(eleve.datePermisObtenu).slice(0, 10)
        : null,
    categoriesPermisObtenues:
      "categoriesPermisObtenues" in eleve
        ? parseCategoriesPermisObtenues(eleve.categoriesPermisObtenues)
        : [],
    permisDelivrePar:
      "permisDelivrePar" in eleve ? eleve.permisDelivrePar ?? null : null,
    moniteurId: "moniteurId" in eleve ? eleve.moniteurId ?? null : null,
    vehiculeId: "vehiculeId" in eleve ? eleve.vehiculeId ?? null : null,
    moniteurLabel:
      "moniteur" in eleve && eleve.moniteur
        ? displayMoniteurNomComplet(eleve.moniteur)
        : null,
    vehiculeMatricule:
      "vehicule" in eleve && eleve.vehicule
        ? eleve.vehicule.matricule?.trim() || null
        : null,
    createdAt: eleve.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }
  } catch (error) {
    console.warn("[toEleveDto] skip", error)
    return null
  }
}

export function toPaiementDto(paiement: Paiement): PaiementDto | null {
  try {
    if (!paiement?.id) return null
    return {
      id: paiement.id,
      eleveId: paiement.eleveId,
      montant: paiement.montant,
      moniteurNom: paiement.moniteurNom,
      createdAt: paiement.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export type EleveInput = {
  telephone: string
  nom: string
  prenom: string
  nin: string
  dateNaissance: string
  lieuNaissance: string
  domicile: string
  sexe: Sexe
  groupeSanguin: string
  categoriePermisId: string
  statutFormation: StatutFormation
  mairieEnregistrement?: string | null
  nationalite: string
  prenomPere?: string | null
  nomMere?: string | null
  prenomMere?: string | null
  nomJeuneFille?: string | null
  situationFamiliale: SituationFamiliale
  situationProfessionnelle: string
  prixPermis?: number
  numeroDossier?: string | null
  dateDepotDwsr?: string | null
  nomAr?: string | null
  prenomAr?: string | null
  permisDejaObtenu?: boolean
  numeroPermisObtenu?: string | null
  datePermisObtenu?: string | null
  categoriesPermisObtenues?: CategoriePermisObtenu[]
  permisDelivrePar?: string | null
  createdAt?: string | null
  moniteurId?: string | null
  vehiculeId?: string | null
}

function trimOrNull(v: unknown): string | null {
  const s = String(v ?? "").trim()
  return s || null
}

export function parseEleveInput(body: unknown): EleveInput {
  if (!body || typeof body !== "object") throw new Error("Corps invalide.")
  const b = body as Record<string, unknown>
  const gs = String(b.groupeSanguin ?? "")
  const groupeSanguin = GROUPE_FROM_CLIENT[gs]
  if (!groupeSanguin) throw new Error("Groupe sanguin invalide.")

  const ninRaw = String(b.nin ?? "").replace(/\D/g, "")
  if (ninRaw.length !== 18) {
    throw new Error("Le N.I.N doit comporter exactement 18 chiffres.")
  }

  const situationProfessionnelle = String(b.situationProfessionnelle ?? "").trim()
  if (!situationProfessionnelle) {
    throw new Error("La situation professionnelle est requise.")
  }

  const prixRaw = b.prixPermis
  const prixPermis =
    prixRaw !== undefined && prixRaw !== null && String(prixRaw).trim() !== ""
      ? Math.max(0, Math.round(Number(prixRaw)))
      : undefined
  if (prixPermis !== undefined && !Number.isFinite(prixPermis)) {
    throw new Error("Montant forfait permis invalide.")
  }

  return {
    telephone: String(b.telephone ?? "").trim(),
    nom: String(b.nom ?? "").trim(),
    prenom: String(b.prenom ?? "").trim(),
    nin: ninRaw,
    dateNaissance: String(b.dateNaissance ?? ""),
    lieuNaissance: String(b.lieuNaissance ?? "").trim(),
    domicile: String(b.domicile ?? "").trim(),
    sexe: b.sexe as Sexe,
    groupeSanguin: gs,
    categoriePermisId: String(b.categoriePermisId ?? b.categoriePermis ?? "").trim(),
    statutFormation: b.statutFormation as StatutFormation,
    mairieEnregistrement: b.mairieEnregistrement ? String(b.mairieEnregistrement) : null,
    nationalite: String(b.nationalite ?? "Algérienne").trim() || "Algérienne",
    prenomPere: b.prenomPere ? String(b.prenomPere) : null,
    nomMere: b.nomMere ? String(b.nomMere) : null,
    prenomMere: b.prenomMere ? String(b.prenomMere) : null,
    nomJeuneFille:
      b.sexe === "feminin" ? trimOrNull(b.nomJeuneFille) : null,
    situationFamiliale: b.situationFamiliale as SituationFamiliale,
    situationProfessionnelle,
    prixPermis,
    numeroDossier: trimOrNull(b.numeroDossier),
    dateDepotDwsr: trimOrNull(b.dateDepotDwsr),
    nomAr: trimOrNull(b.nomAr),
    prenomAr: trimOrNull(b.prenomAr),
    permisDejaObtenu: Boolean(b.permisDejaObtenu),
    numeroPermisObtenu: trimOrNull(b.numeroPermisObtenu),
    datePermisObtenu: trimOrNull(b.datePermisObtenu),
    categoriesPermisObtenues: parseCategoriesPermisObtenues(b.categoriesPermisObtenues),
    permisDelivrePar: trimOrNull(b.permisDelivrePar),
    createdAt: trimOrNull(b.createdAt),
    moniteurId: trimOrNull(b.moniteurId),
    vehiculeId: trimOrNull(b.vehiculeId),
  }
}

export function permisObtenuDataFromInput(input: EleveInput) {
  return permisObtenuPrismaFields({
    permisDejaObtenu: input.permisDejaObtenu ?? false,
    numeroPermisObtenu: input.numeroPermisObtenu,
    datePermisObtenu: input.datePermisObtenu,
    categoriesPermisObtenues: input.categoriesPermisObtenues ?? [],
    permisDelivrePar: input.permisDelivrePar,
  })
}

export function toPrismaEleveData(
  input: EleveInput,
  autoEcoleId: string,
  identifiant: string,
  opts: {
    codeSuivi: string | null
    prixPermis: number
    statutInscription?: StatutInscription
    relations?: EleveRelationsIds
  },
): Prisma.EleveCreateInput {
  const groupe = GROUPE_FROM_CLIENT[input.groupeSanguin]
  return {
    identifiant,
    telephone: input.telephone,
    nom: input.nom,
    prenom: input.prenom,
    nin: input.nin,
    dateNaissance: new Date(input.dateNaissance),
    lieuNaissance: input.lieuNaissance,
    domicile: input.domicile,
    sexe: input.sexe,
    groupeSanguin: groupe,
    statutFormation: input.statutFormation,
    statutInscription: opts.statutInscription ?? "VALIDE",
    ...etapesValideesForStatut(input.statutFormation),
    categoriePermis: { connect: { id: input.categoriePermisId } },
    mairieEnregistrement: input.mairieEnregistrement,
    nationalite: input.nationalite,
    prenomPere: input.prenomPere,
    nomMere: input.nomMere,
    prenomMere: input.prenomMere,
    nomJeuneFille: input.sexe === "feminin" ? input.nomJeuneFille ?? null : null,
    situationFamiliale: input.situationFamiliale,
    situationProfessionnelle: input.situationProfessionnelle,
    prixPermis: opts.prixPermis,
    numeroDossier: input.numeroDossier ?? null,
    dateDepotDwsr: input.dateDepotDwsr ? new Date(input.dateDepotDwsr) : null,
    nomAr: input.nomAr ?? null,
    prenomAr: input.prenomAr ?? null,
    codeSuivi: opts.codeSuivi,
    ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
    autoEcole: { connect: { id: autoEcoleId } },
    ...permisObtenuDataFromInput(input),
    ...(opts.relations?.moniteurId
      ? { moniteur: { connect: { id: opts.relations.moniteurId } } }
      : {}),
    ...(opts.relations?.vehiculeId
      ? { vehicule: { connect: { id: opts.relations.vehiculeId } } }
      : {}),
  }
}

export function eleveRelationsUpdateData(
  relations: EleveRelationsIds,
): Pick<Prisma.EleveUpdateInput, "moniteur" | "vehicule"> {
  return {
    moniteur: relations.moniteurId
      ? { connect: { id: relations.moniteurId } }
      : { disconnect: true },
    vehicule: relations.vehiculeId
      ? { connect: { id: relations.vehiculeId } }
      : { disconnect: true },
  }
}
