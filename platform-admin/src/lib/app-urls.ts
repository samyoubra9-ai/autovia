/**
 * URLs publiques (préfixe VITE_, voir env.urls.example à la racine).
 */
export type AppUrls = {
  app: string
  api: string
  backdash: string
  candidat: string
  platformAdmin: string
}

const DEV: AppUrls = {
  app: 'http://localhost:3000',
  api: 'http://localhost:3000',
  backdash: 'http://localhost:5173',
  candidat: 'http://localhost:5174',
  platformAdmin: 'http://localhost:5175',
}

function trim(value: string | undefined, fallback: string): string {
  const v = value?.trim()
  if (!v) return fallback
  return v.replace(/\/$/, '')
}

export function getAppUrls(): AppUrls {
  const app = trim(
    import.meta.env.VITE_APP_URL as string | undefined,
    DEV.app,
  )
  const api = trim(
    (import.meta.env.VITE_API_URL as string | undefined) ||
      (import.meta.env.VITE_APP_URL as string | undefined),
    DEV.api,
  )
  return {
    app,
    api,
    backdash: trim(import.meta.env.VITE_BACKDASH_URL as string | undefined, DEV.backdash),
    candidat: trim(import.meta.env.VITE_CANDIDAT_URL as string | undefined, DEV.candidat),
    platformAdmin: trim(
      import.meta.env.VITE_PLATFORM_ADMIN_URL as string | undefined,
      DEV.platformAdmin,
    ),
  }
}

export function getApiBaseUrl(): string {
  return getAppUrls().api
}

export function getPlatformUrl(): string {
  return trim(
    import.meta.env.VITE_PLATFORM_URL as string | undefined,
    getAppUrls().app,
  )
}

export function getBackdashUrl(): string {
  return getAppUrls().backdash
}
