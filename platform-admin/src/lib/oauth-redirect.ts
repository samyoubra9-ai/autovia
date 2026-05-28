import { getAppUrls } from '@/lib/app-urls'

function isLocalDevOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true
  } catch {
    return false
  }
  return false
}

export function resolvePlatformAdminOAuthOrigin(): string {
  const configured = getAppUrls().platformAdmin.replace(/\/$/, '')
  const current =
    typeof window !== 'undefined'
      ? window.location.origin.replace(/\/$/, '')
      : ''

  if (current && !isLocalDevOrigin(current)) {
    return current
  }

  if (import.meta.env.PROD && configured && !isLocalDevOrigin(configured)) {
    return configured
  }

  return current || configured
}

export function getPlatformAdminOAuthRedirectUrl(): string {
  return `${resolvePlatformAdminOAuthOrigin()}/auth/callback`
}
