export type FicheCopieVariant = "vehicule" | "formation-theorique"

export type FicheAvancementData = {
  wilayaLabel: string
  photoUrl: string | null
  dateDepotAutoEcole: string
  numeroInscription: string
  moniteur: string
  immatriculationVehicule: string
  telephone: string
  groupeSanguin: string
  sexe: string
  dateDepotDwsr: string
  numeroDossierDwsr: string
  categorieCiblee: string
  nom: string
  prenom: string
  nomJeuneFille: string
  dateNaissance: string
  lieuNaissance: string
  nin: string
  nationalite: string
  domicile: string
  numeroPermisObtenu: string
  datePermisObtenu: string
  categoriesObtenues: string
}
