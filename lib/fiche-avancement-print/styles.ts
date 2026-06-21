import { readFileSync } from "fs"
import { join } from "path"
import {
  FICHE_AVANCEMENT_MARGIN_H_MM,
  FICHE_AVANCEMENT_MARGIN_V_MM,
} from "./constants"

/** Assets embarqués dans lib/ (déployés sur Vercel — backdash/ est gitignored). */
const PRINT_ASSETS_DIR = join(process.cwd(), "lib/fiche-avancement-print")

function readPrintAsset(relPath: string): string {
  return readFileSync(join(PRINT_ASSETS_DIR, relPath), "utf8")
}

/** CSS embarqué pour PDF / HTML officiel. */
export function ficheAvancementPrintStyles(): string {
  const ficheCss = readPrintAsset("styles/fiche-avancement-print.css")
  const printA4 = readPrintAsset("styles/print-a4.css")
  const printDoc = readPrintAsset("styles/print-document.css")

  return `
${ficheCss}
${printA4}
${printDoc}
@media print {
  html.print-landscape-fiche,
  html.print-landscape-fiche body,
  [data-print-fiche-dual] {
    page: fiche-avancement-landscape;
  }
  @page fiche-avancement-landscape {
    size: A4 landscape;
    margin: ${FICHE_AVANCEMENT_MARGIN_V_MM}mm ${FICHE_AVANCEMENT_MARGIN_H_MM}mm;
  }
  @page {
    size: A4 landscape;
    margin: ${FICHE_AVANCEMENT_MARGIN_V_MM}mm ${FICHE_AVANCEMENT_MARGIN_H_MM}mm;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  .fiche-avancement-print-root .fiche-print-row--rectos::before,
  .fiche-avancement-print-root .fiche-print-row--versos::before {
    content: none !important;
    display: none !important;
  }
  .fiche-avancement-print-root .fiche-print-row--versos {
    padding-top: 0 !important;
    border-top: none !important;
  }
  .fiche-avancement-print-root {
    padding: 0 !important;
  }
}
`
}
