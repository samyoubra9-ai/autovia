export const VITRINE_LOCALES = ["fr", "kab"] as const

export type VitrineLocale = (typeof VITRINE_LOCALES)[number]

export const VITRINE_LOCALE_COOKIE = "vitrine-locale"

export const DEFAULT_VITRINE_LOCALE: VitrineLocale = "fr"

export function isVitrineLocale(value: string | null | undefined): value is VitrineLocale {
  return value === "fr" || value === "kab"
}

export function getVitrineLocaleFromCookie(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): VitrineLocale {
  const raw = cookieStore.get(VITRINE_LOCALE_COOKIE)?.value
  return isVitrineLocale(raw) ? raw : DEFAULT_VITRINE_LOCALE
}
