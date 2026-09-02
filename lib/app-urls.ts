/**
 * URLs publiques — source unique côté Next.js (voir `.env` / `env.urls.example`).
 * Les apps Vite (backdash, candidat, platform-admin) utilisent les mêmes valeurs avec le préfixe VITE_.
 */

import { originAliases, preferWwwHttpsOrigin, trimOrigin } from "@/lib/url-origin-aliases"

export type AppUrls = {
  /** Site Next.js : API + landing marketing */
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
  return trimOrigin(v)
}

/** URLs lues depuis NEXT_PUBLIC_* (racine autoecole/.env). */
export function getAppUrls(): AppUrls {
  return {
    app: preferWwwHttpsOrigin(
      trimUrl(process.env.NEXT_PUBLIC_APP_URL, DEV_DEFAULTS.app),
    ),
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

/**
 * Origine sûre pour les redirections auth (évite http://0.0.0.0:3000 en dev).
 * Utilise l'en-tête Host du navigateur, sinon localhost, sinon NEXT_PUBLIC_APP_URL.
 */
export function resolveAppRedirectOrigin(request: Request): string {
  const url = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")
  const hostHeader = forwardedHost ?? request.headers.get("host")

  if (hostHeader && !hostHeader.startsWith("0.0.0.0")) {
    return `${url.protocol}//${hostHeader}`
  }

  if (url.hostname === "0.0.0.0" || url.hostname === "[::]") {
    const port = url.port
    const portSuffix =
      port && port !== "80" && port !== "443" ? `:${port}` : ""
    return `${url.protocol}//localhost${portSuffix}`
  }

  return url.origin
}

export function appRedirectPath(request: Request, path: string): string {
  const base = resolveAppRedirectOrigin(request)
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalized}`
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
  const base = [urls.app, urls.backdash, urls.candidat, urls.platformAdmin, ...extra]
  // Vite en local même si NEXT_PUBLIC_* pointe vers la prod.
  if (process.env.NODE_ENV !== "production") {
    base.push(
      DEV_DEFAULTS.app,
      DEV_DEFAULTS.backdash,
      DEV_DEFAULTS.candidat,
      DEV_DEFAULTS.platformAdmin,
    )
  }
  return [...new Set(base.flatMap((o) => originAliases(o)))]
}

function parseExtraOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(",")
    .map((o) => trimUrl(o, ""))
    .filter(Boolean)
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  )
}

/** Wi‑Fi local (192.168.x.x) : actif en dev sauf ALLOW_DEV_LAN_ORIGINS=false. */
export function isDevLanOriginAllowed(): boolean {
  if (process.env.ALLOW_DEV_LAN_ORIGINS === "false") return false
  if (process.env.ALLOW_DEV_LAN_ORIGINS === "true") return true
  return process.env.NODE_ENV !== "production"
}

export function isDevLanOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== "http:" && protocol !== "https:") return false
    // Loopback : toujours OK hors prod (Vite local), même si ALLOW_DEV_LAN_ORIGINS=false.
    if (isLoopbackHostname(hostname)) {
      return process.env.NODE_ENV !== "production"
    }
    if (!isDevLanOriginAllowed()) return false
    return (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    )
  } catch {
    return false
  }
}
