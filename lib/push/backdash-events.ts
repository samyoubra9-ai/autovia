import type { NatureExamenListe, SeanceStatut, SeanceType } from "@prisma/client"

/** Web Push backdash désactivé — notifications in-app uniquement (cloche). */

export function notifyBackdashSeanceCreated(_params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
}): void {
  /* noop */
}

export function notifyBackdashSeanceUpdated(_params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
  statut: SeanceStatut
  previousStatut: SeanceStatut
  previousDateHeure: Date
}): void {
  /* noop */
}

export function notifyBackdashSeanceDeleted(_params: {
  autoEcoleId: string
  eleveId: string
  type: SeanceType
  dateHeure: Date
}): void {
  /* noop */
}

export function notifyBackdashPaiement(_params: {
  autoEcoleId: string
  eleveId: string
  montant: number
}): void {
  /* noop */
}

export function notifyBackdashExamenListe(_params: {
  autoEcoleId: string
  eleveId: string
  dateExamen: Date
  centreExamen: string
  natureExamen: NatureExamenListe
}): void {
  /* noop */
}

export function notifyBackdashParcoursStep(_params: {
  autoEcoleId: string
  eleveId: string
  stepLabel: string
}): void {
  /* noop */
}
