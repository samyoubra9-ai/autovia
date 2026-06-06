import { LISTE_EXAMEN_PAGE_MARGIN_MM } from "./constants"

/** CSS embarqué pour PDF / HTML officiel — typo fixe, pas de zoom. */
export function listeExamenPrintStyles(): string {
  const margin = LISTE_EXAMEN_PAGE_MARGIN_MM
  return `
@page { size: A4 portrait; margin: ${margin}mm; }
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: 'Segoe UI', 'Traditional Arabic', Arial, 'Times New Roman', sans-serif;
  color: #000; background: #fff; direction: rtl;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.doc { width: 100%; }
.page {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 2mm 4mm;
  page-break-after: always;
  break-after: page;
  overflow: visible;
}
.page:last-child { page-break-after: auto; break-after: auto; }
.top-header {
  text-align: center; font-size: 11pt; font-weight: bold;
  line-height: 1.35; margin-bottom: 5px;
}
.header-section {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px;
}
.header-right, .header-left {
  border: 2px solid #000; border-radius: 8px; padding: 4px 6px;
  text-align: center; font-size: 8pt; font-weight: bold; line-height: 1.35;
  width: 5.4cm; height: 2.5cm;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.ecole-nom-ar { font-size: 10pt; margin-top: 4px; }
.main-title-container { text-align: center; margin: 7px 0; }
.main-title {
  border: 2px solid #000; border-radius: 6px; padding: 5px 16px;
  font-size: 12pt; font-weight: bold; display: inline-block;
}
.doc-reference { margin: 4px 0 0; font-size: 9pt; font-weight: bold; text-align: center; }
.first-page-hint {
  margin: 0 0 6px; padding: 4px 8px; border: 1px dashed #666; border-radius: 4px;
  font-size: 7.5pt; font-weight: bold; text-align: center; line-height: 1.35;
}
.exam-details-box {
  border: 2px solid #000; border-radius: 8px; margin-bottom: 6px; font-size: 9pt; overflow: hidden;
}
.exam-details-row {
  display: flex; justify-content: space-between; padding: 4px 12px; font-weight: bold;
}
.exam-details-bottom { padding: 0 12px 4px; font-weight: bold; }
.exam-details-reference {
  text-align: center; font-size: 8.5pt; font-weight: bold;
  margin-top: 4px; padding-top: 4px; border-top: 1px solid #000;
}
.continuation-banner {
  border: 2px solid #000; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px;
  font-weight: bold; background: #fafafa;
}
.continuation-title { margin: 0; font-size: 9pt; text-align: center; }
.continuation-context { margin: 0; font-size: 8pt; text-align: center; line-height: 1.35; }
.page-main--footer {
  page-break-inside: avoid; break-inside: avoid-page;
}
.sheet-bottom--footer { page-break-inside: avoid; break-inside: avoid-page; }
.main-data-table {
  width: 100%; border-collapse: collapse; border: 2px solid #000;
  font-size: 9pt; table-layout: fixed;
}
.main-data-table th, .main-data-table td {
  border: 1px solid #000; padding: 2px 4px; text-align: center;
  vertical-align: middle; font-weight: bold; line-height: 1.2;
  height: 5.9mm;
}
.main-data-table thead th { background: #e8eaed; border-bottom: 2px solid #000; }
.cell-nom {
  position: relative;
  font-family: 'Traditional Arabic', 'Segoe UI', Tahoma, sans-serif; line-height: 1.3;
  text-align: start;
  padding-inline: 4px;
}
.cell-nom-n { unicode-bidi: isolate; position: relative; z-index: 1; }
.cell-nom-p {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  unicode-bidi: isolate;
  max-width: 55%;
  text-align: center;
  white-space: nowrap;
}
.row-empty td { background: #ececec !important; color: #999 !important; font-weight: normal; }
.rotated-cell { width: 4%; max-width: 28px; }
.rotated-text {
  writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap;
  display: inline-block; font-size: 8.5pt; font-weight: bold;
}
.side-merged-cell { font-size: 10pt; width: 8%; max-width: 32px; }
.footer-layout {
  display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px;
}
.footer-right-side { width: 65%; }
.trainers-info { font-weight: bold; font-size: 8.5pt; line-height: 1.55; margin-bottom: 5px; }
.stats-table {
  width: 85%; border-collapse: collapse; border: 2px solid #000;
  font-size: 8.5pt; text-align: center;
}
.stats-table th, .stats-table td {
  border: 1px solid #000; padding: 3px 6px; font-weight: bold;
}
.stats-table thead th { background: #e8eaed; }
.inspector-stamp-box {
  border: 2px solid #000; border-radius: 12px; width: 200px; height: 88px;
  padding: 10px; font-weight: bold; font-size: 10pt; text-align: center; flex-shrink: 0;
}
.page-footer-meta {
  margin-top: 5px; padding-top: 4px; border-top: 1px solid #ccc; text-align: center;
}
.page-indicator { font-size: 8.5pt; font-weight: bold; display: block; }
.page-legal { font-size: 7pt; font-weight: bold; color: #444; line-height: 1.25; display: block; }
`
}
