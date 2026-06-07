/**
 * Capacités tableau dérivées de la hauteur A4 et des blocs fixes (en-tête, pied, bannière).
 * Évite la 1ère page « en-tête seul » quand le tableau est repoussé par break-inside:avoid.
 */
const PAGE_BODY_MM = 289
const TABLE_ROW_MM = 5.9
const TABLE_HEAD_MM = 9
const SHEET_PADDING_MM = 8
const FIRST_PAGE_HEADER_MM = 112
const CONTINUATION_BANNER_MM = 28
const FOOTER_BLOCK_MM = 100

function tableRowsThatFit(blocksMm: number): number {
  const space = PAGE_BODY_MM - SHEET_PADDING_MM - blocksMm
  return Math.max(1, Math.floor((space - TABLE_HEAD_MM) / TABLE_ROW_MM))
}

export function deriveListeExamenPrintCaps() {
  const firstPageRows = Math.min(tableRowsThatFit(FIRST_PAGE_HEADER_MM), 22)
  const middlePageRows = Math.min(tableRowsThatFit(CONTINUATION_BANNER_MM), 34)
  const lastPageRows = Math.min(
    tableRowsThatFit(CONTINUATION_BANNER_MM + FOOTER_BLOCK_MM),
    14,
  )
  const footerPageMaxTableRows = Math.min(tableRowsThatFit(FOOTER_BLOCK_MM), 14)
  const shortListMaxRows = Math.min(
    tableRowsThatFit(FIRST_PAGE_HEADER_MM + FOOTER_BLOCK_MM),
    11,
  )

  return {
    shortListMaxRows,
    firstPageRows,
    middlePageRows,
    lastPageRows,
    maxRowsPerSectionChunk: 40,
    minRowsBeforeFooterPage: 8,
    footerPageMaxTableRows,
  } as const
}
