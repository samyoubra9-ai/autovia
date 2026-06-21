import { readFileSync } from "fs"
import { join } from "path"

const PRINT_ASSETS_DIR = join(process.cwd(), "lib/fiche-avancement-print")

let cachedDnrLogoDataUri: string | null = null

export function dnrLogoDataUri(): string {
  if (cachedDnrLogoDataUri) return cachedDnrLogoDataUri
  const filePath = join(PRINT_ASSETS_DIR, "assets/dnr.jpeg")
  const bytes = readFileSync(filePath)
  cachedDnrLogoDataUri = `data:image/jpeg;base64,${bytes.toString("base64")}`
  return cachedDnrLogoDataUri
}
