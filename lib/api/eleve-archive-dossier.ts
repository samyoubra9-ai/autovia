import { getProgressPercent, isParcoursTermine } from "@/lib/api/formation"
import { NATURE_EXAMEN_AR, formatDateListe } from "@/lib/api/liste-examen"
import {
  formatResultatPrint,
  parseResultatStored,
  RESULTAT_LABELS,
  type ResultatExamenCandidat,
  type ResultatSexe,
} from "@/lib/api/resultat-examen-candidat"
import { isA1Eleve } from "@/lib/api/permis-a1"
import type { NatureExamenListe, Prisma } from "@prisma/client"

const PARCOURS_STEPS = ["code", "creneau", "circulation"] as const

const PARCOURS_LABELS: Record<(typeof PARCOURS_STEPS)[number], string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
}

export type EleveArchiveExamenRow = {
  dateExamen: string
  natureExamen: NatureExamenListe
  natureLabel: string
  natureLabelAr: string
  centreExamen: string
  wilaya: string
  resultat: ResultatExamenCandidat | null
  resultatLabel: string | null
  resultatAr: string | null
}

export type EleveArchiveParcoursStep = {
  code: (typeof PARCOURS_STEPS)[number]
  label: string
  validee: boolean
  /** Date du premier examen officiel « admis » pour cette étape, si connue. */
  dateObtenue: string | null
}

export type EleveArchiveDossierDto = {
  eleveId: string
  identifiant: string
  nom: string
  prenom: string
  nomAr: string | null
  prenomAr: string | null
  nin: string
  telephone: string
  dateNaissance: string
  lieuNaissance: string
  categoriePermis: string
  categorieCode: string
  numeroDossier: string | null
  statutFormation: string
  parcoursTermine: boolean
  progressionPercent: number
  a1PermisObtenu: boolean
  /** Date d'inscription à l'auto-école. */
  dateInscription: string
  /** Date de l'examen officiel où le candidat est déclaré admis (fin de parcours). */
  dateSortie: string | null
  moniteur: string | null
  ecoleNom: string
  parcours: EleveArchiveParcoursStep[]
  examensOfficiels: EleveArchiveExamenRow[]
  finance: {
    prixPermis: number
    totalPaye: number
    resteAPayer: number
  }
  seancesCount: number
  genereLe: string
}

type EleveArchiveRow = Prisma.EleveGetPayload<{
  include: {
    categoriePermis: true
    moniteur: true
    paiements: true
    seancesExamen: { select: { id: true } }
    listeExamenCandidats: {
      include: {
        listeExamen: {
          select: {
            dateExamen: true
            centreExamen: true
            wilaya: true
          }
        }
      }
    }
  }
}>

function formatDateFr(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${m}/${d.getFullYear()}`
}

function moniteurLabel(
  m: { prenom: string; nom: string } | null | undefined,
): string | null {
  if (!m) return null
  const s = `${m.prenom} ${m.nom}`.trim()
  return s || null
}

function buildExamensOfficiels(
  candidats: EleveArchiveRow["listeExamenCandidats"],
  sexe: ResultatSexe,
): EleveArchiveExamenRow[] {
  return candidats
    .map((c) => {
      const le = c.listeExamen
      const resultat = parseResultatStored(c.resultat)
      const nature = c.natureExamen
      return {
        dateExamen: formatDateListe(le.dateExamen),
        natureExamen: nature,
        natureLabel: PARCOURS_LABELS[nature] ?? nature,
        natureLabelAr: NATURE_EXAMEN_AR[nature] ?? nature,
        centreExamen: le.centreExamen,
        wilaya: le.wilaya,
        resultat,
        resultatLabel: resultat ? RESULTAT_LABELS[resultat] : null,
        resultatAr: formatResultatPrint(resultat, sexe) || null,
      }
    })
    .sort((a, b) => {
      const da = a.dateExamen.split("/").reverse().join("")
      const db = b.dateExamen.split("/").reverse().join("")
      return da.localeCompare(db)
    })
}

function dateAdmisForNature(
  examens: EleveArchiveExamenRow[],
  nature: NatureExamenListe,
): string | null {
  const admis = examens.filter((e) => e.natureExamen === nature && e.resultat === "admis")
  if (admis.length === 0) return null
  return admis[admis.length - 1]?.dateExamen ?? null
}

function buildParcoursSteps(
  eleve: EleveArchiveRow,
  examens: EleveArchiveExamenRow[],
): EleveArchiveParcoursStep[] {
  const flags = {
    code: eleve.etapeCodeValidee,
    creneau: eleve.etapeCreneauValidee,
    circulation: eleve.etapeCirculationValidee,
  }

  return PARCOURS_STEPS.map((code) => ({
    code,
    label: PARCOURS_LABELS[code],
    validee: flags[code],
    dateObtenue: flags[code] ? dateAdmisForNature(examens, code) : null,
  }))
}

function resolveDateSortie(
  parcoursTermine: boolean,
  a1PermisObtenu: boolean,
  examens: EleveArchiveExamenRow[],
  parcours: EleveArchiveParcoursStep[],
): string | null {
  if (!parcoursTermine && !a1PermisObtenu) return null

  const natureFinale: NatureExamenListe = a1PermisObtenu ? "code" : "circulation"
  const dateAdmis = dateAdmisForNature(examens, natureFinale)
  if (dateAdmis) return dateAdmis

  const step = parcours.find((s) => s.code === natureFinale)
  return step?.dateObtenue ?? null
}

export function buildEleveArchiveDossier(
  eleve: EleveArchiveRow,
  ecoleNom: string,
  genereLe: Date = new Date(),
): EleveArchiveDossierDto {
  const examens = buildExamensOfficiels(
    eleve.listeExamenCandidats,
    eleve.sexe === "feminin" ? "feminin" : "masculin",
  )
  const totalPaye = eleve.paiements.reduce((s, p) => s + (p.montant ?? 0), 0)
  const prixPermis = eleve.prixPermis ?? 0
  const a1 =
    isA1Eleve(eleve) &&
    eleve.etapeCodeValidee &&
    !eleve.etapeCreneauValidee &&
    eleve.statutFormation === "valide"
  const parcoursTermine = isParcoursTermine(eleve)
  const parcours = buildParcoursSteps(eleve, examens)

  return {
    eleveId: eleve.id,
    identifiant: eleve.identifiant,
    nom: eleve.nom,
    prenom: eleve.prenom,
    nomAr: eleve.nomAr,
    prenomAr: eleve.prenomAr,
    nin: eleve.nin,
    telephone: eleve.telephone,
    dateNaissance: formatDateFr(eleve.dateNaissance),
    lieuNaissance: eleve.lieuNaissance,
    categoriePermis: eleve.categoriePermis?.libelleFr ?? eleve.categoriePermis?.code ?? "",
    categorieCode: eleve.categoriePermis?.code ?? "",
    numeroDossier: eleve.numeroDossier,
    statutFormation: eleve.statutFormation,
    parcoursTermine,
    progressionPercent: getProgressPercent(eleve),
    a1PermisObtenu: a1,
    dateInscription: formatDateFr(eleve.createdAt),
    dateSortie: resolveDateSortie(parcoursTermine, a1, examens, parcours),
    moniteur: moniteurLabel(eleve.moniteur),
    ecoleNom,
    parcours,
    examensOfficiels: examens,
    finance: {
      prixPermis,
      totalPaye,
      resteAPayer: Math.max(0, prixPermis - totalPaye),
    },
    seancesCount: eleve.seancesExamen.length,
    genereLe: genereLe.toISOString(),
  }
}

export const eleveArchiveInclude = {
  categoriePermis: true,
  moniteur: true,
  paiements: true,
  seancesExamen: { select: { id: true } },
  listeExamenCandidats: {
    include: {
      listeExamen: {
        select: {
          dateExamen: true,
          centreExamen: true,
          wilaya: true,
        },
      },
    },
    orderBy: { listeExamen: { dateExamen: "asc" as const } },
  },
} as const satisfies Prisma.EleveInclude

export async function loadArchiveDossiersForEleves(
  db: { eleve: { findMany: typeof import("@/lib/prisma").prisma.eleve.findMany } },
  autoEcoleId: string,
  eleveIds: string[],
  ecoleNom: string,
): Promise<EleveArchiveDossierDto[]> {
  const uniqueIds = [...new Set(eleveIds.map((id) => id.trim()).filter(Boolean))]
  if (uniqueIds.length === 0) return []

  const rows = await db.eleve.findMany({
    where: { autoEcoleId, id: { in: uniqueIds } },
    include: eleveArchiveInclude,
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  })

  if (rows.length !== uniqueIds.length) {
    throw new Error("Un ou plusieurs candidats sont introuvables.")
  }

  const genereLe = new Date()
  return rows.map((e) => buildEleveArchiveDossier(e, ecoleNom, genereLe))
}
