export function isNetworkError(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? error ?? "")
  const cause = (error as { cause?: unknown })?.cause
  const causeMsg =
    cause && typeof cause === "object"
      ? String((cause as Error).message ?? cause)
      : String(cause ?? "")

  const combined = `${msg} ${causeMsg}`.toLowerCase()

  return (
    combined.includes("fetch failed") ||
    combined.includes("econnreset") ||
    combined.includes("etimedout") ||
    combined.includes("connect timeout") ||
    combined.includes("und_err_connect_timeout") ||
    combined.includes("network") ||
    combined.includes("socket hang up") ||
    combined.includes("aborted")
  )
}

export const NETWORK_ERROR_MESSAGE =
  "Connexion au serveur impossible. Vérifiez votre connexion Internet et réessayez."
