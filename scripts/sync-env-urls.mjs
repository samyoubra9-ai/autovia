/**
 * Synchronise les URLs publiques dans tous les .env à partir de la racine.
 *
 * Dev LAN (une IP + ports) :
 *   PUBLIC_APP_HOST=192.168.43.157
 *   PUBLIC_SCHEME=http
 *   (ne pas définir PUBLIC_BACKDASH_HOST)
 *
 * Prod (sous-domaines, sans ports) :
 *   PUBLIC_SCHEME=https
 *   PUBLIC_APP_HOST=autovia.space
 *   PUBLIC_BACKDASH_HOST=app.autovia.space
 *   PUBLIC_CANDIDAT_HOST=candidat.autovia.space   (optionnel)
 *   PUBLIC_PLATFORM_ADMIN_HOST=admin.autovia.space (optionnel)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseEnv(content) {
  const map = new Map()
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    map.set(key, val)
  }
  return map
}

const SYNC_MARKER = '# --- URLs (généré par npm run env:sync) ---'

function loadRootEnv() {
  const path = join(root, '.env')
  if (!existsSync(path)) {
    console.error('Fichier .env introuvable à la racine.')
    process.exit(1)
  }
  const content = readFileSync(path, 'utf8')
  const userPart = content.split(SYNC_MARKER)[0] ?? content
  return parseEnv(userPart)
}

function upsertLines(content, entries) {
  const keys = new Set(entries.map(([k]) => k))
  const userPart = content.split(SYNC_MARKER)[0] ?? content
  const lines = userPart.split(/\r?\n/)
  const out = []

  for (const line of lines) {
    const t = line.trim()
    const m = t.match(/^([A-Z0-9_]+)\s*=/)
    if (m && keys.has(m[1])) {
      continue
    }
    out.push(line)
  }

  while (out.length && out[out.length - 1]?.trim() === '') out.pop()
  out.push('', SYNC_MARKER)
  for (const [key, value] of entries) {
    out.push(`${key}=${value}`)
  }
  return out.join('\n') + '\n'
}

function mergeEnvFile(path, urlEntries) {
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : ''
  writeFileSync(path, upsertLines(prev, urlEntries), 'utf8')
  console.log('OK', path.replace(root + '\\', '').replace(root + '/', ''))
}

function isLanHost(host) {
  if (!host) return false
  return (
    host === 'localhost' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
  )
}

function origin(scheme, host) {
  const s = (scheme || 'https').replace(/\/$/, '')
  const h = host.replace(/\/$/, '')
  return `${s}://${h}`
}

const rootEnv = loadRootEnv()

// Rétrocompat : PUBLIC_HOST → PUBLIC_APP_HOST
const appHost =
  rootEnv.get('PUBLIC_APP_HOST')?.trim() ||
  rootEnv.get('PUBLIC_HOST')?.trim()
const backdashHost = rootEnv.get('PUBLIC_BACKDASH_HOST')?.trim()
const candidatHost = rootEnv.get('PUBLIC_CANDIDAT_HOST')?.trim()
const platformAdminHost = rootEnv.get('PUBLIC_PLATFORM_ADMIN_HOST')?.trim()
const scheme = (rootEnv.get('PUBLIC_SCHEME') || 'http').replace(/\/$/, '')

if (!appHost) {
  console.error(
    'Ajoutez PUBLIC_APP_HOST=autovia.space (prod) ou PUBLIC_APP_HOST=192.168.x.x (LAN) dans autoecole/.env',
  )
  process.exit(1)
}

/** @type {{ app: string; backdash: string; candidat: string; platformAdmin: string }} */
let urls

if (backdashHost || !isLanHost(appHost)) {
  // Prod : sous-domaines HTTPS (sans ports)
  const prodScheme = scheme === 'http' && isLanHost(appHost) ? 'http' : scheme
  const rootDomain = appHost.replace(/^www\./, '')
  urls = {
    app: origin(prodScheme, appHost),
    backdash: origin(prodScheme, backdashHost || `app.${rootDomain}`),
    candidat: origin(prodScheme, candidatHost || `candidat.${rootDomain}`),
    platformAdmin: origin(
      prodScheme,
      platformAdminHost || `admin.${rootDomain}`,
    ),
  }
  console.log(`Sync URLs (prod / sous-domaines)\n`)
} else {
  const base = `${scheme}://${appHost}`
  urls = {
    app: `${base}:3000`,
    backdash: `${base}:5173`,
    candidat: `${base}:5174`,
    platformAdmin: `${base}:5175`,
  }
  console.log(`Sync URLs (LAN + ports) → ${base}\n`)
}

const isProdLayout = Boolean(backdashHost) || !isLanHost(appHost)

/** En prod : LAN désactivé sauf si explicitement true dans le bloc PUBLIC_* (pas l’ancien sync). */
const allowLan = isProdLayout
  ? rootEnv.get('ALLOW_DEV_LAN_ORIGINS') === 'true'
  : rootEnv.get('ALLOW_DEV_LAN_ORIGINS') === 'true' ||
    (scheme === 'http' && isLanHost(appHost))

const corsExtra = rootEnv.get('CORS_EXTRA_ORIGINS')?.trim() || ''

mergeEnvFile(join(root, '.env'), [
  ['NEXT_PUBLIC_APP_URL', urls.app],
  ['NEXT_PUBLIC_BACKDASH_URL', urls.backdash],
  ['NEXT_PUBLIC_CANDIDAT_URL', urls.candidat],
  ['NEXT_PUBLIC_PLATFORM_ADMIN_URL', urls.platformAdmin],
  ['ALLOW_DEV_LAN_ORIGINS', allowLan ? 'true' : 'false'],
  ['CORS_EXTRA_ORIGINS', corsExtra],
])

const viteBlock = [
  ['VITE_APP_URL', urls.app],
  ['VITE_API_URL', urls.app],
  ['VITE_BACKDASH_URL', urls.backdash],
  ['VITE_CANDIDAT_URL', urls.candidat],
  ['VITE_PLATFORM_ADMIN_URL', urls.platformAdmin],
  ['VITE_PLATFORM_URL', urls.app],
]

for (const sub of ['backdash', 'candidat', 'platform-admin']) {
  mergeEnvFile(join(root, sub, '.env'), viteBlock)
}

console.log('\nLanding Connexion / Démarrer →', urls.backdash + '/sign-in')
console.log('API (backdash) →', urls.app)
console.log('Supabase Auth → Site URL =', urls.backdash)
console.log('Redirect URLs =', urls.backdash + '/auth/callback')
if (corsExtra) console.log('CORS extras =', corsExtra)
console.log('\nRedéployez Vercel (Next + backdash) après avoir copié ces variables.')
