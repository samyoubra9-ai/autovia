export function safeStr(value: unknown, fallback = ""): string {
  if (value == null) return fallback
  const s = String(value).trim()
  return s || fallback
}

export function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function safeBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (value === "true" || value === 1) return true
  if (value === "false" || value === 0) return false
  return fallback
}

export function safeDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (value == null || value === "") return null
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

export function safeMapSync<T, R>(
  items: T[] | null | undefined,
  mapper: (item: T, index: number) => R | null | undefined,
  label = "item",
): R[] {
  const out: R[] = []
  for (let i = 0; i < (items?.length ?? 0); i++) {
    const item = items![i]
    try {
      const mapped = mapper(item, i)
      if (mapped != null) out.push(mapped)
    } catch (error) {
      console.warn(`[safeMap] skip ${label} #${i}`, error)
    }
  }
  return out
}

export async function safeLoad<T>(
  label: string,
  loader: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await loader()
  } catch (error) {
    console.error(`[safeLoad] ${label}`, error)
    return fallback
  }
}
