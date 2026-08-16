import { deriveListeExamenPrintCaps } from "./physical-layout"

/**
 * Capacités impression — dérivées de la hauteur A4 moins en-tête / pied.
 * Garder synchronisé avec backdash/.../liste-examen-print-constants.ts
 */
export const LISTE_EXAMEN_PAGE_MARGIN_MM = 4
/** Marge haute @page (mm) — plus serrée pour gagner des lignes tableau. */
export const LISTE_EXAMEN_PAGE_MARGIN_TOP_MM = 2

/** Cadres cachet / délégation — léger agrandissement (6,4×3,3 → 6,7×3,6). */
export const LISTE_EXAMEN_STAMP_BOX_WIDTH_CM = 6.7
export const LISTE_EXAMEN_STAMP_BOX_HEIGHT_CM = 3.6

export {
  LISTE_EXAMEN_TABLE_ROW_MM,
  LISTE_EXAMEN_TABLE_NOM_FONT_PT,
  LISTE_EXAMEN_TABLE_NOM_VAL_SHIFT_MM,
  LISTE_EXAMEN_TABLE_BODY_FONT_PT,
  LISTE_EXAMEN_TABLE_CELL_FONT_PT,
  LISTE_EXAMEN_TABLE_HEAD_FONT_PT,
  LISTE_EXAMEN_TABLE_SIDE_FONT_PT,
  LISTE_EXAMEN_TABLE_ROTATED_FONT_PT,
  LISTE_EXAMEN_TABLE_CELL_VAL_SHIFT_MM,
  listeExamenPrintTableCssVars,
} from "./physical-layout"

export const LISTE_EXAMEN_PRINT_CAPS = deriveListeExamenPrintCaps()

export type ListeExamenPrintCaps = typeof LISTE_EXAMEN_PRINT_CAPS
