import {
  LISTE_EXAMEN_PAGE_MARGIN_MM,
  LISTE_EXAMEN_PAGE_MARGIN_TOP_MM,
} from "./constants"

/** Même plancher que le script navigateur / backdash. */
export const LISTE_EXAMEN_PRINT_MIN_SCALE = 0.78

/** Marge de sécurité pour éviter une coupure en bas de page. */
export const LISTE_EXAMEN_PRINT_SCALE_EDGE = 0.992

/** Hauteur utile A4 portrait (mm) — alignée @page dans styles.ts. */
export function listeExamenPrintablePageHeightMm(): number {
  return 297 - LISTE_EXAMEN_PAGE_MARGIN_TOP_MM - LISTE_EXAMEN_PAGE_MARGIN_MM
}

export function computeListeExamenPrintScale(
  contentHeightPx: number,
  pageHeightPx: number,
): number {
  if (contentHeightPx <= pageHeightPx || contentHeightPx <= 0 || pageHeightPx <= 0) {
    return 1
  }
  const scale = (pageHeightPx / contentHeightPx) * LISTE_EXAMEN_PRINT_SCALE_EDGE
  return Math.max(
    LISTE_EXAMEN_PRINT_MIN_SCALE,
    Math.round(scale * 1000) / 1000,
  )
}
