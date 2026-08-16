import {
  categoriesInListeGroup,
  listeExamenGroupKey,
} from "@/lib/api/liste-examen-groups"
import type { CategoriePermisEcole } from "@prisma/client"
import type { Prisma } from "@prisma/client"

export type ListeExamenMessageInput = {
  groupKey?: string
  categoriePermisId?: string
  message?: string | null
  heureConvocation?: string | null
}

export type ListeExamenMessageDto = {
  groupKey: string
  categoriePermisId: string
  categorieCode: string
  libelleFr: string
  libelleAr: string | null
  message: string | null
  heureConvocation: string | null
}

function trimOrNull(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function normalizeHeure(v: unknown): string | null {
  const s = trimOrNull(v)
  if (!s) return null
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return s
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)))
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

/** Résout groupKey ou categoriePermisId vers un id catégorie représentatif du groupe. */
export function resolveCategorieIdForMessageGroup(
  input: ListeExamenMessageInput,
  categories: CategoriePermisEcole[],
): string | null {
  if (input.categoriePermisId) {
    const cat = categories.find((c) => c.id === input.categoriePermisId)
    if (!cat) return null
    const gk = listeExamenGroupKey(cat.code)
    const inGroup = categoriesInListeGroup(categories, gk)
    const primary =
      inGroup.find((c) => listeExamenGroupKey(c.code) === gk) ?? inGroup[0] ?? cat
    return primary.id
  }
  const gk = trimOrNull(input.groupKey)?.toUpperCase()
  if (!gk) return null
  const inGroup = categoriesInListeGroup(categories, gk)
  if (inGroup.length === 0) {
    const byCode = categories.find(
      (c) => listeExamenGroupKey(c.code) === gk,
    )
    return byCode?.id ?? null
  }
  return inGroup[0].id
}

export function parseMessagesCategorieInput(
  raw: unknown,
  categories: CategoriePermisEcole[],
): Array<{ categoriePermisId: string; message: string | null; heureConvocation: string | null }> {
  if (!Array.isArray(raw)) return []
  const byCat = new Map<
    string,
    { categoriePermisId: string; message: string | null; heureConvocation: string | null }
  >()
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const catId = resolveCategorieIdForMessageGroup(
      {
        groupKey: o.groupKey as string | undefined,
        categoriePermisId: o.categoriePermisId as string | undefined,
      },
      categories,
    )
    if (!catId) continue
    const message = trimOrNull(o.message)
    const heureConvocation = normalizeHeure(o.heureConvocation)
    if (!message && !heureConvocation) continue
    byCat.set(catId, { categoriePermisId: catId, message, heureConvocation })
  }
  return [...byCat.values()]
}

export async function upsertListeExamenMessages(
  tx: Prisma.TransactionClient,
  listeExamenId: string,
  rows: Array<{
    categoriePermisId: string
    message: string | null
    heureConvocation: string | null
  }>,
) {
  await tx.listeExamenMessageCategorie.deleteMany({
    where: { listeExamenId },
  })
  if (rows.length === 0) return
  await tx.listeExamenMessageCategorie.createMany({
    data: rows.map((r) => ({
      listeExamenId,
      categoriePermisId: r.categoriePermisId,
      message: r.message,
      heureConvocation: r.heureConvocation,
    })),
  })
}

export function toMessagesCategorieDto(
  messages: Array<{
    categoriePermisId: string
    message: string | null
    heureConvocation: string | null
    categoriePermis: CategoriePermisEcole
  }>,
  allCategories: CategoriePermisEcole[],
): ListeExamenMessageDto[] {
  return messages.map((m) => {
    const cat = m.categoriePermis
    const gk = listeExamenGroupKey(cat.code)
    const inGroup = categoriesInListeGroup(allCategories, gk)
    const primary = inGroup[0] ?? cat
    return {
      groupKey: gk,
      categoriePermisId: m.categoriePermisId,
      categorieCode: primary.code,
      libelleFr: primary.libelleFr,
      libelleAr: primary.libelleAr,
      message: m.message,
      heureConvocation: m.heureConvocation,
    }
  })
}

/** Groupes présents dans la sélection candidats (pour UI backdash). */
export function groupKeysFromEleveCategories(
  eleves: Array<{ categoriePermis?: { code: string } | null }>,
): string[] {
  const keys = new Set<string>()
  for (const e of eleves) {
    const code = e.categoriePermis?.code
    if (code) keys.add(listeExamenGroupKey(code))
  }
  return [...keys].sort((a, b) => a.localeCompare(b, "fr"))
}
