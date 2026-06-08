/**
 * Capacités tableau — synchronisé backdash/.../liste-examen-print-physical-layout.ts
 */
const PAGE_BODY_MM = 289

/** Hauteur d'une ligne du tableau candidats (mm) — synchroniser CSS impression. */
export const LISTE_EXAMEN_TABLE_ROW_MM = 4.7

/** Police colonne اللقب والاسم — légèrement agrandie (reste du tableau inchangé). */
export const LISTE_EXAMEN_TABLE_NOM_FONT_PT = 13.5
export const LISTE_EXAMEN_TABLE_NOM_VAL_SHIFT_MM = -0.18

export const LISTE_EXAMEN_TABLE_BODY_FONT_PT = 10
export const LISTE_EXAMEN_TABLE_CELL_FONT_PT = 9.5
export const LISTE_EXAMEN_TABLE_HEAD_FONT_PT = 9.5
export const LISTE_EXAMEN_TABLE_SIDE_FONT_PT = 12
export const LISTE_EXAMEN_TABLE_ROTATED_FONT_PT = 10.5
export const LISTE_EXAMEN_TABLE_CELL_VAL_SHIFT_MM = -0.14

const TABLE_ROW_MM = LISTE_EXAMEN_TABLE_ROW_MM
const TABLE_HEAD_MM = 9
const SHEET_PADDING_MM = 5
const FIRST_PAGE_HEADER_MM = 96
const MIDDLE_PAGE_TOP_MM = 8
const FOOTER_BLOCK_MM = 56

/** B (15) + A/A1 (10) barème officiel. */
export const LISTE_EXAMEN_STANDARD_BA_ROWS = 25

function tableRowsThatFit(blocksMm: number): number {
  const space = PAGE_BODY_MM - SHEET_PADDING_MM - blocksMm
  return Math.max(1, Math.floor((space - TABLE_HEAD_MM) / TABLE_ROW_MM))
}

export function deriveListeExamenPrintCaps() {
  const firstPageTableRows = tableRowsThatFit(FIRST_PAGE_HEADER_MM)
  const middlePageTableRows = tableRowsThatFit(MIDDLE_PAGE_TOP_MM)
  const footerPageMaxTableRows = tableRowsThatFit(FOOTER_BLOCK_MM)
  const singlePageWithFooterMaxRows = tableRowsThatFit(
    FIRST_PAGE_HEADER_MM + FOOTER_BLOCK_MM,
  )

  return {
    standardBaCombinedRows: LISTE_EXAMEN_STANDARD_BA_ROWS,
    singlePageWithFooterMaxRows,
    standardFirstPageMaxRows: singlePageWithFooterMaxRows,
    firstPageTableRows,
    middlePageTableRows,
    footerPageMaxTableRows,
    maxRowsPerSectionChunk: 40,
    minRowsBeforeFooterPage: 6,
    shortListMaxRows: singlePageWithFooterMaxRows,
    firstPageRows: firstPageTableRows,
    middlePageRows: middlePageTableRows,
    lastPageRows: footerPageMaxTableRows,
    firstPageMinFillRatio: 0.9,
    firstPageMinRows: Math.ceil(firstPageTableRows * 0.9),
  } as const
}

/** Variables CSS tableau — injecter sur `.liste-examen-print-document` / `.doc`. */
export function listeExamenPrintTableCssVars(): Record<string, string> {
  return {
    "--liste-examen-row-height": `${LISTE_EXAMEN_TABLE_ROW_MM}mm`,
    "--liste-examen-table-font": `${LISTE_EXAMEN_TABLE_BODY_FONT_PT}pt`,
    "--liste-examen-table-cell-font": `${LISTE_EXAMEN_TABLE_CELL_FONT_PT}pt`,
    "--liste-examen-table-head-font": `${LISTE_EXAMEN_TABLE_HEAD_FONT_PT}pt`,
    "--liste-examen-table-side-font": `${LISTE_EXAMEN_TABLE_SIDE_FONT_PT}pt`,
    "--liste-examen-table-rotated-font": `${LISTE_EXAMEN_TABLE_ROTATED_FONT_PT}pt`,
    "--liste-examen-table-nom-font": `${LISTE_EXAMEN_TABLE_NOM_FONT_PT}pt`,
    "--liste-examen-cell-val-shift": `${LISTE_EXAMEN_TABLE_CELL_VAL_SHIFT_MM}mm`,
    "--liste-examen-cell-nom-shift": `${LISTE_EXAMEN_TABLE_NOM_VAL_SHIFT_MM}mm`,
  }
}
