import { readFileSync } from "fs"
import { join } from "path"

let cachedDnrLogoDataUri: string | null = null

export function dnrLogoDataUri(): string {
  if (cachedDnrLogoDataUri) return cachedDnrLogoDataUri
  const filePath = join(process.cwd(), "backdash/public/images/dnr.jpeg")
  const bytes = readFileSync(filePath)
  cachedDnrLogoDataUri = `data:image/jpeg;base64,${bytes.toString("base64")}`
  return cachedDnrLogoDataUri
}
