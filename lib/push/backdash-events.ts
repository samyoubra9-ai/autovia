import { SEANCE_TYPE_LABELS } from "@/lib/api/seance-type"
import { fireBackdashPush } from "@/lib/push/send-backdash"
import { prisma } from "@/lib/prisma"
import type { NatureExamenListe, SeanceStatut, SeanceType } from "@prisma/client"

const NATURE_EXAMEN_LABELS: Record<NatureExamenListe, string> = {
  code: "Code",
  creneau: "Créneau",
  circulation: "Circulation",
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
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

async function eleveLabel(autoEcoleId: string, eleveId: string): Promise<string | null> {
  const e = await prisma.eleve.findFirst({
    where: { id: eleveId, autoEcoleId },
    select: { prenom: true, nom: true },
  })
  if (!e) return null
  return `${e.prenom} ${e.nom}`.trim()
}

export function notifyBackdashSeanceCreated(params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
}): void {
  if (params.statut === "annule") return
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)
    fireBackdashPush(params.autoEcoleId, {
      title: "Nouvelle séance",
      body: `${typeLabel} — ${name} · ${when}`,
      url: "/seances",
      tag: `bd-seance-new-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyBackdashSeanceUpdated(params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
  previousStatut: SeanceStatut
  previousDateHeure: Date
}): void {
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)

    if (params.statut === "annule" && params.previousStatut !== "annule") {
      fireBackdashPush(params.autoEcoleId, {
        title: "Séance annulée",
        body: `${typeLabel} — ${name} · ${when}`,
        url: "/seances",
        tag: `bd-seance-cancel-${params.eleveId}`,
        urgent: true,
      })
      return
    }

    const dateChanged =
      params.dateHeure.getTime() !== params.previousDateHeure.getTime()
    const statutChanged = params.statut !== params.previousStatut
    if ((!dateChanged && !statutChanged) || params.statut === "annule") return

    fireBackdashPush(params.autoEcoleId, {
      title: dateChanged ? "Séance reprogrammée" : "Séance mise à jour",
      body: `${typeLabel} — ${name} · ${when}`,
      url: "/seances",
      tag: `bd-seance-upd-${params.eleveId}`,
      urgent: dateChanged,
    })
  })()
}

export function notifyBackdashSeanceDeleted(params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
}): void {
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    const typeLabel = SEANCE_TYPE_LABELS[params.type]
    const when = formatDateTimeFr(params.dateHeure)
    fireBackdashPush(params.autoEcoleId, {
      title: "Séance supprimée",
      body: `${typeLabel} — ${name} · ${when}`,
      url: "/seances",
      tag: `bd-seance-del-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyBackdashPaiement(params: {
  autoEcoleId: string
  eleveId: string
  montant: number
}): void {
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    const montant = params.montant.toLocaleString("fr-DZ")
    fireBackdashPush(params.autoEcoleId, {
      title: "Paiement enregistré",
      body: `${montant} DZD — ${name}`,
      url: "/paiements",
      tag: `bd-paiement-${params.eleveId}`,
    })
  })()
}

export function notifyBackdashExamenListe(params: {
  autoEcoleId: string
  eleveId: string
  dateExamen: Date
  centreExamen: string
  natureExamen: NatureExamenListe
}): void {
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    const nature = NATURE_EXAMEN_LABELS[params.natureExamen]
    const date = formatDateFr(params.dateExamen)
    fireBackdashPush(params.autoEcoleId, {
      title: "Candidat sur liste d'examen",
      body: `${name} — ${nature} le ${date} (${params.centreExamen})`,
      url: "/listes-examen",
      tag: `bd-examen-${params.eleveId}`,
      urgent: true,
    })
  })()
}

export function notifyBackdashParcoursStep(params: {
  autoEcoleId: string
  eleveId: string
  stepLabel: string
}): void {
  void (async () => {
    const name = await eleveLabel(params.autoEcoleId, params.eleveId)
    if (!name) return
    fireBackdashPush(params.autoEcoleId, {
      title: "Étape validée",
      body: `${name} — ${params.stepLabel}`,
      url: "/eleves",
      tag: `bd-parcours-${params.eleveId}`,
    })
  })()
}
