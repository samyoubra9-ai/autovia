/**
 * Synchronise les URLs publiques dans tous les .env à partir de PUBLIC_HOST / PUBLIC_SCHEME (racine).
 * Usage : modifier PUBLIC_HOST dans autoecole/.env puis `npm run env:sync`
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

function loadRootEnv() {
  const path = join(root, '.env')
  if (!existsSync(path)) {
    console.error('Fichier .env introuvable à la racine.')
    process.exit(1)
  }
  return parseEnv(readFileSync(path, 'utf8'))
}

function upsertLines(content, entries) {
  const keys = new Set(entries.map(([k]) => k))
  const lines = content.split(/\r?\n/)
  const out = []
  const seen = new Set()

  for (const line of lines) {
    const t = line.trim()
    const m = t.match(/^([A-Z0-9_]+)\s*=/)
    if (m && keys.has(m[1])) {
      continue
    }
    out.push(line)
  }

  if (out.length && out[out.length - 1] !== '') out.push('')
  out.push('# --- URLs (généré par npm run env:sync) ---')
  for (const [key, value] of entries) {
    out.push(`${key}=${value}`)
    seen.add(key)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n'
}

function mergeEnvFile(path, urlEntries) {
  const prev = existsSync(path) ? readFileSync(path, 'utf8') : ''
  writeFileSync(path, upsertLines(prev, urlEntries), 'utf8')
  console.log('OK', path.replace(root + '\\', '').replace(root + '/', ''))
}

const rootEnv = loadRootEnv()
const host = rootEnv.get('PUBLIC_HOST')?.trim()
const scheme = (rootEnv.get('PUBLIC_SCHEME') || 'http').replace(/\/$/, '')

if (!host) {
  console.error('Ajoutez PUBLIC_HOST=192.168.x.x (ou votre domaine) dans autoecole/.env')
  process.exit(1)
}

const base = `${scheme}://${host}`
const urls = {
  app: `${base}:3000`,
  backdash: `${base}:5173`,
  candidat: `${base}:5174`,
  platformAdmin: `${base}:5175`,
}

const allowLan =
  rootEnv.get('ALLOW_DEV_LAN_ORIGINS') === 'true' ||
  (scheme === 'http' && /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(host))

console.log(`Sync URLs → ${base} (ports 3000, 5173, 5174, 5175)\n`)

mergeEnvFile(join(root, '.env'), [
  ['NEXT_PUBLIC_APP_URL', urls.app],
  ['NEXT_PUBLIC_BACKDASH_URL', urls.backdash],
  ['NEXT_PUBLIC_CANDIDAT_URL', urls.candidat],
  ['NEXT_PUBLIC_PLATFORM_ADMIN_URL', urls.platformAdmin],
  ['ALLOW_DEV_LAN_ORIGINS', allowLan ? 'true' : 'false'],
  ['CORS_EXTRA_ORIGINS', rootEnv.get('CORS_EXTRA_ORIGINS') || ''],
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

console.log('\nPensez à redémarrer npm run dev (racine + backdash).')
console.log('Supabase Auth → Site URL =', urls.backdash)
console.log('Redirect URLs =', urls.backdash + '/auth/callback')
