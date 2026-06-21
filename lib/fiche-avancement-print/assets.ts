import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const PRINT_MODULE_DIR = dirname(fileURLToPath(import.meta.url))

let cachedDnrLogoDataUri: string | null = null

function readPrintBinary(relPath: string): Buffer {
  const candidates = [
    join(PRINT_MODULE_DIR, relPath),
    join(process.cwd(), "lib/fiche-avancement-print", relPath),
  ]

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      return readFileSync(filePath)
    }
  }

  throw new Error(
    `Asset PDF fiche introuvable (${relPath}). Chemins testés: ${candidates.join(" | ")}`,
  )
}

export function dnrLogoDataUri(): string {
  if (cachedDnrLogoDataUri) return cachedDnrLogoDataUri
  const bytes = readPrintBinary("assets/dnr.jpeg")
  cachedDnrLogoDataUri = `data:image/jpeg;base64,${bytes.toString("base64")}`
  return cachedDnrLogoDataUri
}
