import { normalizeCodeSuivi } from "@/lib/api/code-suivi"
import { SEANCE_TYPE_LABELS } from "@/lib/api/seance-type"
import { fireCandidatPush } from "@/lib/push/send-candidat"
import { prisma } from "@/lib/prisma"
import type { NatureExamenListe, SeanceStatut, SeanceType } from "@prisma/client"

const NATURE_EXAMEN_LABELS: Record<NatureExamenListe, string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
}

function suiviPath(codeSuivi: string, segment?: string): string {
  const code = normalizeCodeSuivi(codeSuivi)
  const base = `/s/${encodeURIComponent(code)}`
  return segment ? `${base}/${segment}` : base
}

function formatDateTimeFr(date: Date): string {
  return date.toLocaleString("fr-DZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

async function elevePushContext(eleveId: string) {
  return prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { id: true, codeSuivi: true },
  })
}

export function notifyCandidatSeanceCreated(params: {
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
  messageCandidat?: string | null
}): void {
  if (params.statut === "annule") return
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)
    const extra = params.messageCandidat?.trim()
    fireCandidatPush(params.eleveId, {
      title: "Nouvelle séance planifiée",
      body: extra
        ? `${typeLabel} — ${when}. ${extra}`
        : `${typeLabel} le ${when}.`,
      url: suiviPath(eleve.codeSuivi, "seances"),
      tag: `seance-new-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyCandidatSeanceUpdated(params: {
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
  previousStatut: SeanceStatut
  previousDateHeure: Date
  messageCandidat?: string | null
}): void {
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)
    const path = suiviPath(eleve.codeSuivi, "seances")

    if (params.statut === "annule" && params.previousStatut !== "annule") {
      fireCandidatPush(params.eleveId, {
        title: "Séance annulée",
        body: `Votre séance ${typeLabel} prévue le ${when} a été annulée.`,
        url: path,
        tag: `seance-cancel-${params.eleveId}`,
        urgent: true,
      })
      return
    }

    const dateChanged =
      params.dateHeure.getTime() !== params.previousDateHeure.getTime()
    const statutChanged = params.statut !== params.previousStatut
    if ((!dateChanged && !statutChanged) || params.statut === "annule") return

    const extra = params.messageCandidat?.trim()
    fireCandidatPush(params.eleveId, {
      title: dateChanged ? "Séance reprogrammée" : "Séance mise à jour",
      body: extra
        ? `${typeLabel} — ${when}. ${extra}`
        : `${typeLabel} le ${when}.`,
      url: path,
      tag: `seance-upd-${params.eleveId}`,
      urgent: dateChanged,
    })
  })()
}

export function notifyCandidatSeanceDeleted(params: {
  eleveId: string
  type: SeanceType
  dateHeure: Date
}): void {
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)
    fireCandidatPush(params.eleveId, {
      title: "Séance supprimée",
      body: `La séance ${typeLabel} du ${when} n'est plus au planning.`,
      url: suiviPath(eleve.codeSuivi, "seances"),
      tag: `seance-del-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyCandidatPaiement(params: {
  eleveId: string
  montant: number
  resteAPayer: number
}): void {
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    const montant = params.montant.toLocaleString("fr-DZ")
    const reste = params.resteAPayer.toLocaleString("fr-DZ")
    fireCandidatPush(params.eleveId, {
      title: "Paiement enregistré",
      body:
        params.resteAPayer > 0
          ? `${montant} DZD reçus. Reste à payer : ${reste} DZD.`
          : `${montant} DZD reçus. Votre forfait est entièrement réglé.`,
      url: suiviPath(eleve.codeSuivi, "paiements"),
      tag: `paiement-${params.eleveId}`,
    })
  })()
}

export function notifyCandidatExamenListe(params: {
  eleveId: string
  dateExamen: Date
  centreExamen: string
  wilaya: string
  natureExamen: NatureExamenListe
  heureConvocation?: string | null
  messageCategorie?: string | null
}): void {
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    const nature = NATURE_EXAMEN_LABELS[params.natureExamen]
    const date = formatDateFr(params.dateExamen)
    const convoc = [
      params.heureConvocation?.trim(),
      params.messageCategorie?.trim(),
    ]
      .filter(Boolean)
      .join(" — ")
    fireCandidatPush(params.eleveId, {
      title: "Convocation examen",
      body: convoc
        ? `${nature} le ${date} à ${params.centreExamen} (${params.wilaya}). ${convoc}`
        : `${nature} le ${date} — ${params.centreExamen}, ${params.wilaya}.`,
      url: suiviPath(eleve.codeSuivi, "examens"),
      tag: `examen-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyCandidatParcoursStep(params: {
  eleveId: string
  stepLabel: string
}): void {
  void (async () => {
    const eleve = await elevePushContext(params.eleveId)
    if (!eleve?.codeSuivi) return
    fireCandidatPush(params.eleveId, {
      title: "Étape validée",
      body: `Votre auto-école a validé : ${params.stepLabel}.`,
      url: suiviPath(eleve.codeSuivi, "parcours"),
      tag: `parcours-${params.eleveId}`,
    })
  })()
}
