import type { Prisma } from "@prisma/client"
import { sortCandidatsWithinCategory } from "@/lib/api/liste-examen-candidat-order"

type CandidatRow = {
  id: string
  categoriePermisId: string
  ordre: number
  natureExamen: string
  eleve: { numeroDossier: string | null }
}

/** Réordonne les `ordre` en base (1…n par catégorie) selon les règles d'affichage. */
export async function reorderListeExamenCandidatsOrdre(
  tx: Prisma.TransactionClient,
  listeId: string,
): Promise<void> {
  const rows = await tx.listeExamenCandidat.findMany({
    where: { listeExamenId: listeId },
    include: { eleve: { select: { numeroDossier: true } } },
    orderBy: [{ categoriePermisId: "asc" }, { ordre: "asc" }],
  })
  if (rows.length === 0) return

  const byCat = new Map<string, CandidatRow[]>()
  for (const row of rows) {
    const list = byCat.get(row.categoriePermisId) ?? []
    list.push(row)
    byCat.set(row.categoriePermisId, list)
  }

  const updates: { id: string; ordre: number }[] = []

  for (const group of byCat.values()) {
    const sorted = sortCandidatsWithinCategory(
      group.map((row) => ({
        ...row,
        sansDossier: !row.eleve.numeroDossier?.trim(),
      })),
    )
    sorted.forEach((row, index) => {
      const nextOrdre = index + 1
      if (row.ordre !== nextOrdre) {
        updates.push({ id: row.id, ordre: nextOrdre })
      }
    })
  }

  if (updates.length === 0) return

  // Éviter le conflit unique (liste, catégorie, ordre) pendant la mise à jour.
  for (let i = 0; i < updates.length; i++) {
    await tx.listeExamenCandidat.update({
      where: { id: updates[i]!.id },
      data: { ordre: 10_000 + i },
    })
  }
  for (const { id, ordre } of updates) {
    await tx.listeExamenCandidat.update({
      where: { id },
      data: { ordre },
    })
  }
}
