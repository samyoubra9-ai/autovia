/**
 * Copie les icônes depuis public/brand/favicon/ vers Next, backdash, candidat, platform-admin.
 * Usage : npm run brand:sync
 */
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'public', 'brand', 'favicon')

function need(file) {
  const p = join(src, file)
  if (!existsSync(p)) {
    console.error(`Manquant : public/brand/favicon/${file}`)
    process.exit(1)
  }
  return p
}

function copy(from, to) {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
  console.log('→', to.replace(root + '\\', '').replace(root + '/', ''))
}

const faviconSvg = need('favicon.svg')
const faviconIco = need('favicon.ico')
const apple = need('apple-touch-icon.png')
const png96 = need('favicon-96x96.png')
const png192 = need('web-app-manifest-192x192.png')
const png512 = need('web-app-manifest-512x512.png')

// Backdash
copy(faviconSvg, join(root, 'backdash', 'public', 'images', 'favicon.svg'))
copy(faviconSvg, join(root, 'backdash', 'public', 'images', 'favicon_light.svg'))
copy(png192, join(root, 'backdash', 'public', 'images', 'favicon.png'))
copy(png192, join(root, 'backdash', 'public', 'images', 'favicon_light.png'))
copy(faviconSvg, join(root, 'backdash', 'public', 'images', 'pwa', 'icon.svg'))
// Chrome Android : PNG 192 + 512 réels (pas le favicon 192 déclaré en 512)
copy(png192, join(root, 'backdash', 'public', 'images', 'pwa', 'icon-192.png'))
copy(png512, join(root, 'backdash', 'public', 'images', 'pwa', 'icon-512.png'))
copy(apple, join(root, 'backdash', 'public', 'images', 'pwa', 'apple-touch-icon.png'))

const headimage = join(root, 'public', 'landing', 'headimage.png')
if (existsSync(headimage)) {
  copy(headimage, join(root, 'backdash', 'public', 'images', 'headimage.png'))
} else {
  console.warn('Optionnel : public/landing/headimage.png absent (auth backdash)')
}

// Candidat
copy(faviconSvg, join(root, 'candidat', 'public', 'icon.svg'))
copy(png192, join(root, 'candidat', 'public', 'icons', 'icon-192.png'))
copy(png512, join(root, 'candidat', 'public', 'icons', 'icon-512.png'))
copy(apple, join(root, 'candidat', 'public', 'icons', 'apple-touch-icon.png'))

// Platform-admin
copy(faviconSvg, join(root, 'platform-admin', 'public', 'icon.svg'))
copy(png192, join(root, 'platform-admin', 'public', 'icon-192.png'))
copy(png512, join(root, 'platform-admin', 'public', 'icon-512.png'))

console.log('\nOK — icônes synchronisées. Redémarrez les serveurs de dev.')
