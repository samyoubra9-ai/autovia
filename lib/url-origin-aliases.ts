/** Retire le slash final. */
export function trimOrigin(url: string): string {
  return url.replace(/\/$/, "")
}

/**
 * Vercel/DNS redirigent souvent apex → www ; les fetch cross-origin + redirect cassent CORS.
 * Retourne l’URL canonique https://www.domaine.tld pour l’API.
 */
export function preferWwwHttpsOrigin(url: string): string {
  const trimmed = trimOrigin(url)
  try {
    const u = new URL(trimmed)
    if (u.protocol !== "https:") return trimmed
    if (u.hostname.startsWith("www.")) return trimmed
    if (u.hostname === "localhost") return trimmed
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return trimmed
    const labels = u.hostname.split(".")
    if (labels.length === 2) {
      return `${u.protocol}//www.${u.hostname}`
    }
  } catch {
    /* noop */
  }
  return trimmed
}

/** Variantes apex ↔ www pour CORS. */
export function originAliases(url: string): string[] {
  const base = trimOrigin(url)
  const out = new Set<string>([base])
  try {
    const u = new URL(base)
    if (u.hostname.startsWith("www.")) {
      out.add(`${u.protocol}//${u.hostname.slice(4)}`)
    } else if (
      u.hostname !== "localhost" &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) &&
      u.hostname.split(".").length === 2
    ) {
      out.add(`${u.protocol}//www.${u.hostname}`)
    }
  } catch {
    /* noop */
  }
  return [...out]
}
