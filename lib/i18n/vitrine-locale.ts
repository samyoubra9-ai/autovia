export const VITRINE_LOCALES = ["fr", "kab", "ar"] as const

export type VitrineLocale = (typeof VITRINE_LOCALES)[number]

export const VITRINE_LOCALE_COOKIE = "vitrine-locale"

export const DEFAULT_VITRINE_LOCALE: VitrineLocale = "fr"

/** Libellés courts affichés dans le sélecteur de langue. */
export const VITRINE_LOCALE_SHORT: Record<VitrineLocale, string> = {
  fr: "FR",
  kab: "KAB",
  ar: "AR",
}

export function isVitrineLocale(value: string | null | undefined): value is VitrineLocale {
  return value === "fr" || value === "kab" || value === "ar"
}

export function getVitrineLocaleFromCookie(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): VitrineLocale {
  const raw = cookieStore.get(VITRINE_LOCALE_COOKIE)?.value
  return isVitrineLocale(raw) ? raw : DEFAULT_VITRINE_LOCALE
}
