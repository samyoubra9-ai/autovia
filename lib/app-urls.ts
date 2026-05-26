/**
 * URLs publiques — source unique côté Next.js (voir `.env` / `env.urls.example`).
 * Les apps Vite (backdash, candidat, platform-admin) utilisent les mêmes valeurs avec le préfixe VITE_.
 */

export type AppUrls = {
  /** Site Next.js : API, landing, suivi QR (/suivi/…) */
  app: string
  backdash: string
  candidat: string
  platformAdmin: string
}

const DEV_DEFAULTS: AppUrls = {
  app: "http://localhost:3000",
  backdash: "http://localhost:5173",
  candidat: "http://localhost:5174",
  platformAdmin: "http://localhost:5175",
}

function trimUrl(value: string | undefined, fallback: string): string {
  const v = value?.trim()
  if (!v) return fallback
  return v.replace(/\/$/, "")
}

/** URLs lues depuis NEXT_PUBLIC_* (racine autoecole/.env). */
export function getAppUrls(): AppUrls {
  return {
    app: trimUrl(process.env.NEXT_PUBLIC_APP_URL, DEV_DEFAULTS.app),
    backdash: trimUrl(process.env.NEXT_PUBLIC_BACKDASH_URL, DEV_DEFAULTS.backdash),
    candidat: trimUrl(process.env.NEXT_PUBLIC_CANDIDAT_URL, DEV_DEFAULTS.candidat),
    platformAdmin: trimUrl(
      process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL,
      DEV_DEFAULTS.platformAdmin,
    ),
  }
}

export function getAppUrl(): string {
  return getAppUrls().app
}

export function getBackdashUrl(): string {
  return getAppUrls().backdash
}

/** Connexion auto-école (landing, liens marketing) → backdash. */
export function getBackdashSignInUrl(): string {
  const base = getBackdashUrl()
  const path =
    process.env.NEXT_PUBLIC_BACKDASH_SIGN_IN_PATH?.trim() || "/sign-in"
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}

/** Inscription auto-école (essai gratuit, créer un compte). */
export function getBackdashSignUpUrl(): string {
  const base = getBackdashUrl()
  const path =
    process.env.NEXT_PUBLIC_BACKDASH_SIGN_UP_PATH?.trim() || "/sign-up"
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
}

export function getCandidatUrl(): string {
  return getAppUrls().candidat
}

export function getPlatformAdminUrl(): string {
  return getAppUrls().platformAdmin
}

/** Origines autorisées pour CORS (toutes les apps + extras optionnels). */
export function getAllowedOrigins(): string[] {
  const urls = getAppUrls()
  const extra = parseExtraOrigins(process.env.CORS_EXTRA_ORIGINS)
  return [...new Set([urls.app, urls.backdash, urls.candidat, urls.platformAdmin, ...extra])]
}

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(",")
    .map((o) => trimUrl(o, ""))
    .filter(Boolean)
}

/** Wi‑Fi local (192.168.x.x) : actif en dev sauf ALLOW_DEV_LAN_ORIGINS=false. */
export function isDevLanOriginAllowed(): boolean {
  if (process.env.ALLOW_DEV_LAN_ORIGINS === "false") return false
  if (process.env.ALLOW_DEV_LAN_ORIGINS === "true") return true
  return process.env.NODE_ENV !== "production"
}

export function isDevLanOrigin(origin: string): boolean {
  if (!isDevLanOriginAllowed()) return false
  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== "http:" && protocol !== "https:") return false
    return (
      hostname === "localhost" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    )
  } catch {
    return false
  }
}
