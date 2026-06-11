import { prisma } from "@/lib/prisma"

export const ELEVE_ABSENCE_NJ_ALERT_THRESHOLD = 3
export const ELEVE_ABSENCE_J_ALERT_THRESHOLD = 5

export type EleveAbsenceSummary = {
  eleveId: string
  prenom: string
  nom: string
  absentNj: number
  absentJ: number
}

export async function getEleveAbsencesSummary(
  autoEcoleId: string,
): Promise<EleveAbsenceSummary[]> {
  const candidats = await prisma.listeExamenCandidat.findMany({
    where: {
      resultat: { in: ["absent_j", "absent_nj"] },
      eleve: { autoEcoleId },
    },
    select: {
      resultat: true,
      eleveId: true,
      eleve: { select: { prenom: true, nom: true } },
    },
  })

  const byEleve = new Map<string, EleveAbsenceSummary>()

  for (const row of candidats) {
    const resultat = row.resultat?.trim()
    if (resultat !== "absent_j" && resultat !== "absent_nj") continue

    let summary = byEleve.get(row.eleveId)
    if (!summary) {
      summary = {
        eleveId: row.eleveId,
        prenom: row.eleve.prenom,
        nom: row.eleve.nom,
        absentJ: 0,
        absentNj: 0,
      }
      byEleve.set(row.eleveId, summary)
    }

    if (resultat === "absent_j") summary.absentJ += 1
    else summary.absentNj += 1
  }

  return [...byEleve.values()].filter(
    (e) =>
      e.absentNj >= ELEVE_ABSENCE_NJ_ALERT_THRESHOLD ||
      e.absentJ >= ELEVE_ABSENCE_J_ALERT_THRESHOLD,
  )
}
