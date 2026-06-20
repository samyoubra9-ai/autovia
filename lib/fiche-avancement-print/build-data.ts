import type { AutoEcole, CategoriePermisEcole, Eleve, Moniteur, Vehicule } from "@prisma/client"
import { toAutoEcolePrintSettings } from "@/lib/api/auto-ecole-print"
import { elevePhotoPublicUrl } from "@/lib/api/eleve-photo"
import { GROUPE_TO_CLIENT } from "@/lib/api/mappers"
import { displayMoniteurNomComplet } from "@/lib/api/moniteur"
import {
  formatCategoriesPermisObtenues,
  parseCategoriesPermisObtenues,
} from "@/lib/api/permis-obtenu"
import type { FicheAvancementData } from "./types"

const SEXE_LABELS: Record<string, string> = {
  masculin: "Masculin",
  feminin: "Féminin",
}

export type EleveForFicheAvancement = Eleve & {
  categoriePermis: CategoriePermisEcole | null
  moniteur: Moniteur | null
  vehicule: Vehicule | null
}

function formatDateFr(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}/${m}/${d.getFullYear()}`
}

function val(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function buildFicheAvancementDataFromEleve(
  eleve: EleveForFicheAvancement,
  autoEcole: AutoEcole,
): FicheAvancementData {
  const printSettings = toAutoEcolePrintSettings(autoEcole)
  const sexeLabel = SEXE_LABELS[eleve.sexe] ?? eleve.sexe
  const categoriesObtenues = parseCategoriesPermisObtenues(eleve.categoriesPermisObtenues)

  return {
    wilayaLabel: val(printSettings.wilaya) || val(printSettings.ville),
    photoUrl: elevePhotoPublicUrl(eleve.photoPath, eleve.updatedAt),
    dateDepotAutoEcole: eleve.createdAt ? formatDateFr(eleve.createdAt) : "",
    numeroInscription: val(eleve.identifiant),
    moniteur: eleve.moniteur ? displayMoniteurNomComplet(eleve.moniteur) : "",
    immatriculationVehicule: val(eleve.vehicule?.matricule),
    telephone: val(eleve.telephone),
    groupeSanguin: GROUPE_TO_CLIENT[eleve.groupeSanguin] ?? val(eleve.groupeSanguin),
    sexe: sexeLabel,
    dateDepotDwsr: "",
    numeroDossierDwsr: val(eleve.numeroDossier),
    categorieCiblee: val(eleve.categoriePermis?.code),
    nom: val(eleve.nom),
    prenom: val(eleve.prenom),
    nomJeuneFille: val(eleve.nomJeuneFille),
    dateNaissance: eleve.dateNaissance ? formatDateFr(eleve.dateNaissance) : "",
    lieuNaissance: val(eleve.lieuNaissance),
    nin: val(eleve.nin),
    nationalite: val(eleve.nationalite),
    domicile: val(eleve.domicile),
    numeroPermisObtenu: eleve.permisDejaObtenu ? val(eleve.numeroPermisObtenu) : "",
    datePermisObtenu:
      eleve.permisDejaObtenu && eleve.datePermisObtenu
        ? formatDateFr(eleve.datePermisObtenu)
        : "",
    categoriesObtenues: eleve.permisDejaObtenu
      ? formatCategoriesPermisObtenues(categoriesObtenues)
      : "",
  }
}
