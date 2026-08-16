export const COOKIE_CONSENT_KEY = "autovia-cookie-consent"
export const CONSENT_VERSION = 1
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

export type CookieConsent = {
  version: typeof CONSENT_VERSION
  analytics: boolean
  learning: boolean
  decidedAt: string
}

export function parseConsentCookie(
  raw: string | undefined | null,
): CookieConsent | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as CookieConsent
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.learning !== "boolean" ||
      typeof parsed.decidedAt !== "string"
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent))
}

export function createAcceptAllConsent(): CookieConsent {
  return {
    version: CONSENT_VERSION,
    analytics: true,
    learning: true,
    decidedAt: new Date().toISOString(),
  }
}

export function createRejectOptionalConsent(): CookieConsent {
  return {
    version: CONSENT_VERSION,
    analytics: false,
    learning: false,
    decidedAt: new Date().toISOString(),
  }
}

export function readConsentFromDocument(): CookieConsent | null {
  if (typeof document === "undefined") return null

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_KEY}=([^;]*)`),
  )
  if (!match?.[1]) return null
  return parseConsentCookie(match[1])
}

export function writeConsentToDocument(consent: CookieConsent): void {
  if (typeof document === "undefined") return

  document.cookie = `${COOKIE_CONSENT_KEY}=${serializeConsent(consent)};path=/;max-age=${CONSENT_MAX_AGE_SECONDS};SameSite=Lax`
}
