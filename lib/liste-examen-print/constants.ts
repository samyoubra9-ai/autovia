import { deriveListeExamenPrintCaps } from "./physical-layout"

/**
 * Capacités impression — dérivées de la hauteur A4 moins en-tête / pied.
 * Garder synchronisé avec backdash/.../liste-examen-print-constants.ts
 */
export const LISTE_EXAMEN_PAGE_MARGIN_MM = 4

export const LISTE_EXAMEN_PRINT_CAPS = deriveListeExamenPrintCaps()

export type ListeExamenPrintCaps = typeof LISTE_EXAMEN_PRINT_CAPS
