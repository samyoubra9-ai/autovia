import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  FICHE_AVANCEMENT_MARGIN_H_MM,
  FICHE_AVANCEMENT_MARGIN_V_MM,
} from "./constants"

const PRINT_MODULE_DIR = dirname(fileURLToPath(import.meta.url))

function readPrintAsset(relPath: string): string {
  const candidates = [
    join(PRINT_MODULE_DIR, relPath),
    join(process.cwd(), "lib/fiche-avancement-print", relPath),
  ]

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return readFileSync(filePath, "utf8")
    }
  }

  throw new Error(
    `Asset PDF fiche introuvable (${relPath}). Chemins testés: ${candidates.join(" | ")}`,
  )
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

  /* PDF serveur (Puppeteer) : zoom CSS non fiable → transform + position statique */
  html.print-landscape-fiche:has(.fiche-avancement-print-root[data-fiche-pdf-official]),
  html.print-landscape-fiche:has(.fiche-avancement-print-root[data-fiche-pdf-official]) body {
    height: auto !important;
    overflow: visible !important;
  }

  .fiche-avancement-print-root[data-fiche-pdf-official] {
    position: static !important;
    overflow: visible !important;
  }

  .fiche-avancement-print-root[data-fiche-pdf-official] .print-a4-sheet {
    zoom: 1 !important;
    transform: scale(var(--print-fit-scale, 1)) !important;
    transform-origin: top left !important;
    width: calc(100% / var(--print-fit-scale, 1)) !important;
  }

  .fiche-avancement-print-root[data-fiche-pdf-official] .fiche-print-row .print-a4-viewport {
    overflow: visible !important;
    justify-content: flex-start !important;
  }

  .fiche-avancement-print-root[data-fiche-pdf-official] .fiche-print-row--versos .print-a4-viewport {
    justify-content: center !important;
  }
}
`
}
