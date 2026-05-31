const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 5

type Entry = { count: number; resetAt: number }

const hits = new Map<string, Entry>()

export function checkContactRateLimit(clientKey: string): boolean {
  const now = Date.now()
  const entry = hits.get(clientKey)

  if (!entry || now > entry.resetAt) {
    hits.set(clientKey, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) {
    return false
  }

  entry.count += 1
  return true
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}
