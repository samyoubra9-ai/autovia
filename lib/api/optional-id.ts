export function parseOptionalRelationId(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  const s = String(raw).trim()
  if (s === '__none__') return null
  return s
}
