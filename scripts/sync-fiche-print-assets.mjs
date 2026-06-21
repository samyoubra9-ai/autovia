/**
 * Copie CSS + logo backdash → lib/fiche-avancement-print (déployé avec Next.js sur Vercel).
 * À lancer après modification des styles backdash de la fiche d'avancement.
 */
import { copyFileSync, existsSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const backdash = join(root, "backdash")
const outStyles = join(root, "lib/fiche-avancement-print/styles")
const outAssets = join(root, "lib/fiche-avancement-print/assets")

const copies = [
  [
    join(backdash, "src/features/eleves/components/fiche-avancement-print.css"),
    join(outStyles, "fiche-avancement-print.css"),
  ],
  [join(backdash, "src/styles/print-a4.css"), join(outStyles, "print-a4.css")],
  [join(backdash, "src/styles/print-document.css"), join(outStyles, "print-document.css")],
  [join(backdash, "public/images/dnr.jpeg"), join(outAssets, "dnr.jpeg")],
]

if (!existsSync(backdash)) {
  console.warn("sync-fiche-print-assets: backdash/ absent — rien à copier.")
  process.exit(0)
}

mkdirSync(outStyles, { recursive: true })
mkdirSync(outAssets, { recursive: true })

for (const [src, dest] of copies) {
  if (!existsSync(src)) {
    console.error(`Fichier source introuvable: ${src}`)
    process.exit(1)
  }
  copyFileSync(src, dest)
  console.log(`Copié → ${dest.replace(root + "\\", "").replace(root + "/", "")}`)
}

console.log("sync-fiche-print-assets: terminé.")
