import {
  categoriePermisArLabel,
  type CategoriePermisDto,
  toCategoriePermisDto,
} from "@/lib/api/categories-permis"
import { formatDateListe, NATURE_EXAMEN_AR } from "@/lib/api/liste-examen"
import {
  categoriesInListeGroup,
  categoriesUsedByListeCandidats,
  candidatMatchesPrintVariant,
  listeExamenGroupKey,
  listeExamenGroupKeysFromCandidats,
  type ListeExamenPrintVariant,
} from "@/lib/api/liste-examen-groups"
import {
  compareListeExamenCandidatsForDisplay,
  compareListeExamenCandidatsWithinCategory,
} from "@/lib/api/liste-examen-candidat-order"
import { sectionTableRowCount } from "@/lib/liste-examen-places-reglement"
import {
  toMessagesCategorieDto,
  type ListeExamenMessageDto,
} from "@/lib/api/liste-examen-messages"
import {
  formatResultatPrint,
  parseResultatStored,
  type ResultatExamenCandidat,
} from "@/lib/api/resultat-examen-candidat"
import {
  candidatNomPartsFromEleve,
  formatCandidatNomLabel,
} from "@/lib/liste-examen-print/format-candidat-nom"
import type {
  CategoriePermisEcole,
  Eleve,
  ListeExamen,
  ListeExamenCandidat,
  NatureExamenListe,
} from "@prisma/client"

function safeFormatDateListe(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return ""
  return formatDateListe(d)
}

export type ListeExamenCandidatDto = {
  id: string
  eleveId: string
  categoriePermisId: string
  categorieCode: string
  ordre: number
  natureExamen: NatureExamenListe
  natureExamenAr: string
  dateDernierExamen: string | null
  resultat: ResultatExamenCandidat | null
  resultatAr: string
  numeroDossier: string
  sansDossier: boolean
  /** اللقب — en tête de cellule */
  nomListe: string
  /** الاسم — après espace */
  prenomListe: string
  nomCompletAr: string
  dateNaissance: string
  categorieAr: string
  sexe: "masculin" | "feminin"
  eleve?: {
    id: string
    nom: string
    prenom: string
    categoriePermis: string
    statutFormation: string
    sexe: "masculin" | "feminin"
  }
}

export type ListeExamenSectionPrint = {
  categoriePermisId: string
  code: string
  libelleFr: string
  libelleAr: string | null
  placesMax: number
  rows: (ListeExamenCandidatDto | null)[]
}

export type ListeExamenDto = {
  id: string
  centreExamen: string
  wilaya: string
  dateDepot: string
  dateExamen: string
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
  statut: string
  createdAt: string
  candidats: ListeExamenCandidatDto[]
  sections: ListeExamenSectionPrint[]
  /** Sections semi-remorque (BE, CE, DE, C1E) — impression séparée. */
  sectionsSemiRemorque: ListeExamenSectionPrint[]
  stats: {
    code: number
    creneau: number
    circulation: number
    total: number
  }
  statsSemiRemorque: {
    code: number
    creneau: number
    circulation: number
    total: number
  }
  messagesCategorie: ListeExamenMessageDto[]
}

type CandidatWithRelations = ListeExamenCandidat & {
  eleve: Eleve & { categoriePermis: CategoriePermisEcole | null }
  categoriePermis: CategoriePermisEcole
}

function toCandidatDto(c: CandidatWithRelations): ListeExamenCandidatDto {
  const dossier = c.eleve.numeroDossier?.trim() ?? ""
  const cat = c.categoriePermis ?? c.eleve.categoriePermis
  const nomParts = candidatNomPartsFromEleve(c.eleve)
  return {
    id: c.id,
    eleveId: c.eleveId,
    categoriePermisId: c.categoriePermisId,
    categorieCode: cat?.code ?? "",
    ordre: c.ordre,
    natureExamen: c.natureExamen,
    natureExamenAr: NATURE_EXAMEN_AR[c.natureExamen] ?? String(c.natureExamen),
    dateDernierExamen: c.dateDernierExamen
      ? safeFormatDateListe(c.dateDernierExamen)
      : null,
    resultat: parseResultatStored(c.resultat),
    resultatAr: formatResultatPrint(
      parseResultatStored(c.resultat),
      c.eleve.sexe === "feminin" ? "feminin" : "masculin",
    ),
    numeroDossier: dossier,
    sansDossier: !dossier,
    nomListe: nomParts.nom,
    prenomListe: nomParts.prenom,
    nomCompletAr: formatCandidatNomLabel(nomParts),
    dateNaissance: safeFormatDateListe(c.eleve.dateNaissance),
    categorieAr: categoriePermisArLabel(cat),
    sexe: c.eleve.sexe === "feminin" ? "feminin" : "masculin",
    eleve: {
      id: c.eleve.id,
      nom: c.eleve.nom,
      prenom: c.eleve.prenom,
      categoriePermis: cat?.code ?? "",
      statutFormation: c.eleve.statutFormation,
      sexe: c.eleve.sexe === "feminin" ? "feminin" : "masculin",
    },
  }
}

function padRows(
  items: ListeExamenCandidatDto[],
  total: number,
): (ListeExamenCandidatDto | null)[] {
  const rows: (ListeExamenCandidatDto | null)[] = [...items]
  while (rows.length < total) rows.push(null)
  return rows.slice(0, total)
}

export function countStatsForCandidats(
  candidats: Pick<ListeExamenCandidatDto, "natureExamen">[],
) {
  return {
    code: candidats.filter((c) => c.natureExamen === "code").length,
    creneau: candidats.filter((c) => c.natureExamen === "creneau").length,
    circulation: candidats.filter((c) => c.natureExamen === "circulation").length,
    total: candidats.length,
  }
}

export function buildSectionsForPrint(
  candidats: ListeExamenCandidatDto[],
  categories: CategoriePermisEcole[] | CategoriePermisDto[],
  variant: ListeExamenPrintVariant = "principal",
): ListeExamenSectionPrint[] {
  const filtered = candidats.filter((c) =>
    candidatMatchesPrintVariant(c.categorieCode, variant),
  )
  if (filtered.length === 0) return []

  type CatRow = { id: string; code: string; libelleFr: string; libelleAr: string | null; placesListe: number; ordre: number; actif: boolean; surListeExamen: boolean }
  const all: CatRow[] = categories.map((c) => ({
    id: c.id,
    code: c.code,
    libelleFr: c.libelleFr,
    libelleAr: c.libelleAr,
    placesListe: "placesListe" in c ? c.placesListe : 10,
    ordre: c.ordre,
    actif: c.actif,
    surListeExamen: "surListeExamen" in c ? c.surListeExamen : true,
  }))

  const allCats = categoriesUsedByListeCandidats(all, filtered)
  const orderedKeys = listeExamenGroupKeysFromCandidats(filtered, all)

  return orderedKeys.map((gk) => {
    const catsInGroup = categoriesInListeGroup(allCats, gk)
    const primaryCat =
      catsInGroup.find((c) => c.code.toUpperCase() === gk) ?? catsInGroup[0]

    const items = filtered
      .filter((c) => {
        const code =
          c.categorieCode ||
          allCats.find((x) => x.id === c.categoriePermisId)?.code ||
          ""
        return listeExamenGroupKey(code) === gk
      })
      .sort(compareListeExamenCandidatsWithinCategory)

    const rowCount = sectionTableRowCount(gk, items.length)

    return {
      categoriePermisId: primaryCat?.id ?? items[0]?.categoriePermisId ?? gk,
      code: gk,
      libelleFr: primaryCat?.libelleFr ?? `Catégorie ${gk}`,
      libelleAr: primaryCat?.libelleAr ?? null,
      placesMax: rowCount,
      rows: padRows(items, rowCount),
    }
  })
}

export function listeExamenDtoForPrint(
  dto: ListeExamenDto,
  variant: ListeExamenPrintVariant = "principal",
): ListeExamenDto {
  if (variant === "semi-remorque") {
    return {
      ...dto,
      sections: dto.sectionsSemiRemorque,
      stats: dto.statsSemiRemorque,
    }
  }
  return dto
}

type ListeWithMessages = ListeExamen & {
  candidats: CandidatWithRelations[]
  messagesCategorie?: Array<{
    categoriePermisId: string
    message: string | null
    heureConvocation: string | null
    categoriePermis: CategoriePermisEcole
  }>
}

export function toListeExamenDto(
  liste: ListeWithMessages,
  allCategories: CategoriePermisEcole[],
): ListeExamenDto {
  const candidats = liste.candidats.map(toCandidatDto).sort(compareListeExamenCandidatsForDisplay)

  const categoryDtos = allCategories.map(toCategoriePermisDto)
  const principalCandidats = candidats.filter((c) =>
    candidatMatchesPrintVariant(c.categorieCode, "principal"),
  )
  const semiRemorqueCandidats = candidats.filter((c) =>
    candidatMatchesPrintVariant(c.categorieCode, "semi-remorque"),
  )

  const sections = buildSectionsForPrint(candidats, categoryDtos, "principal")
  const sectionsSemiRemorque = buildSectionsForPrint(
    candidats,
    categoryDtos,
    "semi-remorque",
  )

  return {
    id: liste.id,
    centreExamen: liste.centreExamen,
    wilaya: liste.wilaya,
    dateDepot: safeFormatDateListe(liste.dateDepot),
    dateExamen: safeFormatDateListe(liste.dateExamen),
    inspecteurNom: liste.inspecteurNom,
    moniteur1Nom: liste.moniteur1Nom,
    moniteur1Categorie: liste.moniteur1Categorie,
    moniteur2Nom: liste.moniteur2Nom,
    moniteur2Categorie: liste.moniteur2Categorie,
    ecoleNomAr: liste.ecoleNomAr,
    ecoleAdresse: liste.ecoleAdresse,
    ecoleRegistre: liste.ecoleRegistre,
    ecoleTelephone: liste.ecoleTelephone,
    referenceEnvoi: liste.referenceEnvoi,
    lieuRedaction: liste.lieuRedaction,
    statut: liste.statut,
    createdAt: liste.createdAt?.toISOString?.() ?? new Date().toISOString(),
    candidats,
    sections,
    sectionsSemiRemorque,
    stats: countStatsForCandidats(principalCandidats),
    statsSemiRemorque: countStatsForCandidats(semiRemorqueCandidats),
    messagesCategorie: liste.messagesCategorie
      ? toMessagesCategorieDto(liste.messagesCategorie, allCategories)
      : [],
  }
}

/** @deprecated utiliser buildSectionsForPrint */
export function buildCandidatRowsForPrint(
  dto: Pick<ListeExamenDto, "sections">,
) {
  const first = dto.sections[0]
  const second = dto.sections[1]
  return {
    groupeB: first?.rows ?? [],
    groupeA: second?.rows ?? [],
    sections: dto.sections,
  }
}
