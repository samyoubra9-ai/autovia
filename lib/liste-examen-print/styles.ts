import { LISTE_EXAMEN_PAGE_MARGIN_MM, LISTE_EXAMEN_TABLE_ROW_MM } from "./constants"

/** CSS embarqué pour PDF / HTML officiel — typo fixe, pas de zoom. */
export function listeExamenPrintStyles(): string {
  const margin = LISTE_EXAMEN_PAGE_MARGIN_MM
  const rowH = `${LISTE_EXAMEN_TABLE_ROW_MM}mm`
  return `
@page { size: A4 portrait; margin: ${margin}mm; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: 'Segoe UI', 'Traditional Arabic', Arial, 'Times New Roman', sans-serif;
  font-size: 11pt; font-weight: 700;
  color: #000; background: #fff; direction: rtl;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.doc { width: 100%; font-weight: 700; }
.page {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 2mm 4mm;
  page-break-inside: auto;
  break-inside: auto;
  overflow: visible;
}
.page + .page {
  page-break-before: always;
  break-before: page;
}
.page:last-child { page-break-after: auto; break-after: auto; }
.doc.liste-examen-print-fit-active .page {
  overflow: visible;
}
.doc.liste-examen-print-fit-active .page {
  transform-origin: top center;
}
.page--footer-only {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 277mm;
}
.page--footer-only .page-main {
  flex: 0 0 auto;
  width: 100%;
}
.footer-section,
.footer-layout {
  page-break-inside: avoid;
  break-inside: avoid-page;
}
.top-header {
  text-align: center; font-size: 13pt; font-weight: 700;
  line-height: 1.35; margin-bottom: 5px;
}
.header-section {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px;
}
.header-right, .header-left {
  border: 2px solid #000; border-radius: 8px; padding: 3px 5px;
  text-align: center; font-size: 10pt; font-weight: 700; line-height: 1.3;
  width: 6.4cm; height: 3.3cm; min-width: 6.4cm; min-height: 3.3cm;
  box-sizing: border-box; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.ecole-nom-ar { font-size: 12pt; font-weight: 700; margin-top: 4px; }
.main-title-container { text-align: center; margin: 7px 0; }
.main-title {
  border: 2px solid #000; border-radius: 6px; padding: 5px 16px;
  font-size: 14pt; font-weight: 700; display: inline-block;
}
.doc-reference { margin: 4px 0 0; font-size: 11pt; font-weight: 700; text-align: center; }
.first-page-hint {
  margin: 0 0 6px; padding: 4px 8px; border: 1px dashed #666; border-radius: 4px;
  font-size: 9.5pt; font-weight: 700; text-align: center; line-height: 1.35;
}
.exam-details-box {
  border: 2px solid #000; border-radius: 8px; margin-bottom: 6px; font-size: 11pt;
  font-weight: 700; overflow: hidden;
}
.exam-details-row {
  display: flex; justify-content: space-between; padding: 4px 12px; font-weight: 700;
}
.exam-details-bottom { padding: 0 12px 4px; font-weight: 700; }
.exam-details-reference {
  text-align: center; font-size: 10.5pt; font-weight: 700;
  margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;
}
.continuation-banner {
  border: 2px solid #000; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px;
  font-weight: 700; background: #fafafa;
}
.continuation-title { margin: 0; font-size: 11pt; font-weight: 700; text-align: center; }
.continuation-context { margin: 0; font-size: 10pt; font-weight: 700; text-align: center; line-height: 1.35; }
.continuation-legal { margin: 0; font-size: 9.5pt; font-weight: 700; text-align: center; color: #333; line-height: 1.3; }
.page-main {
  page-break-inside: auto; break-inside: auto;
}
.page-main--footer {
  page-break-inside: auto; break-inside: auto;
}
.sheet-bottom--footer { page-break-inside: auto; break-inside: auto; }
.main-data-table thead { display: table-header-group; }
.main-data-table tr { page-break-inside: auto; break-inside: auto; }
.main-data-table {
  width: 100%; border-collapse: collapse; border: 2px solid #000;
  font-size: 10pt; font-weight: 700; table-layout: fixed;
}
.main-data-table th, .main-data-table td {
  border: 1px solid #000; padding: 0.45mm 1px 0.4mm; text-align: center;
  vertical-align: middle; font-weight: 700; line-height: 1.18;
  height: ${rowH}; min-height: ${rowH}; max-height: ${rowH};
  box-sizing: border-box; overflow-x: hidden; overflow-y: visible;
}
.main-data-table thead th {
  background: #e8eaed; border-bottom: 2px solid #000;
  white-space: nowrap; font-size: 9.5pt; font-weight: 700; line-height: 1.18;
  padding: 0.45mm 1px 0.4mm;
}
.main-data-table td.cell-centre,
.main-data-table td.cell-ordre {
  white-space: nowrap; text-overflow: clip;
  font-family: 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif;
  font-size: 9.5pt; font-weight: 700; line-height: 1.18;
  padding: 0.48mm 1px 0.38mm;
}
.main-data-table .cell-val {
  display: inline-block; max-width: 100%; overflow: visible;
  white-space: nowrap; font-weight: 700; line-height: 1.18;
  vertical-align: middle; transform: translateY(-0.14mm);
}
.cell-nom {
  font-family: 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif; line-height: 1.18;
  font-weight: 700; text-align: start;
  padding: 0.48mm 4px 0.38mm; overflow-x: hidden; overflow-y: visible;
  white-space: nowrap; text-overflow: clip;
}
.cell-nom-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  min-height: 1em;
  transform: translateY(-0.14mm);
}
.main-data-table td.cell-ordre {
  font-size: 9.5pt;
  font-weight: 700;
}
.cell-nom-n { unicode-bidi: isolate; justify-self: start; }
.cell-nom-p { grid-column: 2; unicode-bidi: isolate; justify-self: center; white-space: nowrap; }
.row-empty td {
  background: #ececec !important;
  color: #999 !important;
  font-weight: 700;
  border: 1px solid #000 !important;
}
.rotated-cell { width: 4%; max-width: 28px; }
.rotated-text {
  writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap;
  display: inline-block; font-size: 10.5pt; font-weight: 700;
}
.side-merged-cell { font-size: 12pt; font-weight: 700; width: 8%; max-width: 32px; }
.footer-layout {
  display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px;
}
.footer-right-side { width: 65%; }
.trainers-info { font-weight: 700; font-size: 10.5pt; line-height: 1.55; margin-bottom: 5px; }
.stats-table {
  width: 85%; border-collapse: collapse; border: 2px solid #000;
  font-size: 10.5pt; font-weight: 700; text-align: center;
}
.stats-table th, .stats-table td {
  border: 1px solid #000; padding: 0.35mm 4px 0.55mm; font-weight: 700;
  vertical-align: middle; text-align: center;
  overflow: hidden; white-space: nowrap; line-height: 1.15;
  font-family: 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif;
}
.stats-table thead th { background: #e8eaed; }
.inspector-stamp-box {
  border: 2px solid #000; border-radius: 12px;
  width: 6.4cm; height: 3.3cm; min-width: 6.4cm; min-height: 3.3cm;
  box-sizing: border-box; padding: 8px; font-weight: 700; font-size: 11.5pt;
  text-align: center; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.page-footer-meta {
  margin-top: 5px; padding-top: 4px; border-top: 1px solid #ccc; text-align: center;
}
.page-indicator { font-size: 10.5pt; font-weight: 700; display: block; }
.page-legal { font-size: 9pt; font-weight: 700; color: #444; line-height: 1.25; display: block; }
`
}
