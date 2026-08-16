import type { AutoEcole } from "@prisma/client"

/** Champs imprimés sur liste examen + bordereau d'envoi */
export type AutoEcolePrintSettings = {
  nom: string
  ville: string | null
  telephone: string | null
  wilaya: string | null
  nomAr: string | null
  adresseMagasin: string | null
  numeroRegistre: string | null
  centreExamenDefaut: string | null
  lieuRedaction: string | null
  referenceEnvoi: string | null
}

export type AutoEcolePrintInput = {
  nom?: string | null
  wilaya?: string | null
  nomAr?: string | null
  adresseMagasin?: string | null
  numeroRegistre?: string | null
  centreExamenDefaut?: string | null
  lieuRedaction?: string | null
  referenceEnvoi?: string | null
  telephone?: string | null
  ville?: string | null
}

function trimOrNull(v: unknown): string | null {
  const s = String(v ?? "").trim()
  return s || null
}

export function toAutoEcolePrintSettings(ae: AutoEcole): AutoEcolePrintSettings {
  return {
    nom: ae.nom,
    ville: ae.ville,
    telephone: ae.telephone,
    wilaya: ae.wilaya,
    nomAr: ae.nomAr,
    adresseMagasin: ae.adresseMagasin,
    numeroRegistre: ae.numeroRegistre,
    centreExamenDefaut: ae.centreExamenDefaut,
    lieuRedaction: ae.lieuRedaction,
    referenceEnvoi: ae.referenceEnvoi,
  }
}

export function parseAutoEcolePrintInput(body: unknown): AutoEcolePrintInput {
  if (!body || typeof body !== "object") throw new Error("Corps invalide.")
  const b = body as Record<string, unknown>
  let nom: string | null | undefined
  if (b.nom !== undefined) {
    nom = trimOrNull(b.nom)
    if (!nom || nom.length < 2) {
      throw new Error("Nom d'auto-école trop court (2 caractères minimum).")
    }
  }
  return {
    nom,
    wilaya: trimOrNull(b.wilaya),
    nomAr: trimOrNull(b.nomAr),
    adresseMagasin: trimOrNull(b.adresseMagasin),
    numeroRegistre: trimOrNull(b.numeroRegistre),
    centreExamenDefaut: trimOrNull(b.centreExamenDefaut),
    lieuRedaction: trimOrNull(b.lieuRedaction),
    referenceEnvoi: trimOrNull(b.referenceEnvoi),
    telephone: trimOrNull(b.telephone),
    ville: trimOrNull(b.ville),
  }
}

export function printSettingsToPrismaUpdate(input: AutoEcolePrintInput) {
  const data: Record<string, string | null> = {
    wilaya: input.wilaya ?? null,
    nomAr: input.nomAr ?? null,
    adresseMagasin: input.adresseMagasin ?? null,
    numeroRegistre: input.numeroRegistre ?? null,
    centreExamenDefaut: input.centreExamenDefaut ?? null,
    lieuRedaction: input.lieuRedaction ?? null,
    referenceEnvoi: input.referenceEnvoi ?? null,
    telephone: input.telephone ?? null,
    ville: input.ville ?? null,
  }
  if (input.nom !== undefined) {
    data.nom = input.nom
  }
  return data
}

/** Fusion paramètres école + champs propres à une liste (dates, centre session, etc.) */
export type ListePrintContext = {
  wilaya: string
  centreExamen: string
  dateDepot: string
  dateExamen: string
  inspecteurNom: string | null
  moniteur1Nom: string | null
  moniteur1Categorie: string | null
  moniteur2Nom: string | null
  moniteur2Categorie: string | null
}

export function resolveBordereauMeta(
  settings: AutoEcolePrintSettings,
  liste?: {
    wilaya?: string
    dateDepot?: string
    referenceEnvoi?: string | null
    lieuRedaction?: string | null
    ecoleNomAr?: string | null
    ecoleAdresse?: string | null
    ecoleRegistre?: string | null
    ecoleTelephone?: string | null
  },
) {
  return {
    wilaya: liste?.wilaya?.trim() || settings.wilaya || "",
    ecoleNomAr: liste?.ecoleNomAr ?? settings.nomAr,
    ecoleAdresse: liste?.ecoleAdresse ?? settings.adresseMagasin,
    ecoleRegistre: liste?.ecoleRegistre ?? settings.numeroRegistre,
    ecoleTelephone: liste?.ecoleTelephone ?? settings.telephone,
    referenceEnvoi: liste?.referenceEnvoi?.trim() || null,
    lieuRedaction:
      settings.ville?.trim() ||
      settings.wilaya?.trim() ||
      liste?.wilaya?.trim() ||
      "",
    dateRedaction: liste?.dateDepot,
  }
}
