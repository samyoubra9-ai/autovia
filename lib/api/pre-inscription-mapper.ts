import type { CategoriePermisEcole, Eleve } from "@prisma/client"

import { elevePhotoPublicUrl } from "@/lib/api/eleve-photo"
import { GROUPE_TO_CLIENT } from "@/lib/api/mappers"
import { parseCategoriesPermisObtenues } from "@/lib/api/permis-obtenu"

export type PreInscriptionDto = {
  id: string
  prenom: string
  nom: string
  telephone: string
  nin: string
  dateNaissance: string
  lieuNaissance: string
  domicile: string | null
  sexe: string
  groupeSanguin: string
  categoriePermis: {
    id: string
    code: string
    libelleFr: string
  }
  mairieEnregistrement: string | null
  nationalite: string
  prenomPere: string | null
  nomMere: string | null
  prenomMere: string | null
  nomJeuneFille: string | null
  situationFamiliale: string
  situationProfessionnelle: string
  numeroDossier: string | null
  nomAr: string | null
  prenomAr: string | null
  photoUrl: string | null
  permisDejaObtenu: boolean
  numeroPermisObtenu: string | null
  datePermisObtenu: string | null
  categoriesPermisObtenues: string[]
  permisDelivrePar: string | null
  createdAt: string
}

type Row = Eleve & { categoriePermis: CategoriePermisEcole }

export function toPreInscriptionDto(row: Row): PreInscriptionDto | null {
  try {
    return {
      id: row.id,
      prenom: row.prenom,
      nom: row.nom,
      telephone: row.telephone,
      nin: row.nin,
      dateNaissance: row.dateNaissance.toISOString().slice(0, 10),
      lieuNaissance: row.lieuNaissance,
      domicile: row.domicile,
      sexe: row.sexe,
      groupeSanguin: GROUPE_TO_CLIENT[row.groupeSanguin] ?? row.groupeSanguin,
      categoriePermis: {
        id: row.categoriePermis.id,
        code: row.categoriePermis.code,
        libelleFr: row.categoriePermis.libelleFr,
      },
      mairieEnregistrement: row.mairieEnregistrement,
      nationalite: row.nationalite,
      prenomPere: row.prenomPere,
      nomMere: row.nomMere,
      prenomMere: row.prenomMere,
      nomJeuneFille: row.nomJeuneFille,
      situationFamiliale: row.situationFamiliale,
      situationProfessionnelle: row.situationProfessionnelle,
      numeroDossier: row.numeroDossier,
      nomAr: row.nomAr,
      prenomAr: row.prenomAr,
      photoUrl: elevePhotoPublicUrl(row.photoPath, row.updatedAt),
      permisDejaObtenu: row.permisDejaObtenu,
      numeroPermisObtenu: row.numeroPermisObtenu,
      datePermisObtenu: row.datePermisObtenu
        ? row.datePermisObtenu.toISOString().slice(0, 10)
        : null,
      categoriesPermisObtenues: parseCategoriesPermisObtenues(row.categoriesPermisObtenues),
      permisDelivrePar: row.permisDelivrePar,
      createdAt: row.createdAt.toISOString(),
    }
  } catch {
    return null
  }
}
