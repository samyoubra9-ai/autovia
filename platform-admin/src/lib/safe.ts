export function formatClientError(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message
  return fallback
}

export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && e.name === 'AbortError')
}
