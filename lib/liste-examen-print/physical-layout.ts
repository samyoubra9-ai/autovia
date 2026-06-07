/**
 * Capacités tableau — synchronisé lib/liste-examen-print/physical-layout.ts
 */
const PAGE_BODY_MM = 289
/** Hauteur d'une ligne du tableau candidats (mm) — synchroniser CSS impression. */
export const LISTE_EXAMEN_TABLE_ROW_MM = 4.7

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
