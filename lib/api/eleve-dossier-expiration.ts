import { calendarDayUtc } from "@/lib/api/liste-examen"
import { prisma } from "@/lib/prisma"

/** Alerte dans les notifications à partir de 30 jours avant l'expiration. */
export const DOSSIER_ALERT_DAYS_BEFORE = 30

export type EleveDossierExpirationSummary = {
  eleveId: string
  prenom: string
  nom: string
  /** Date du dernier examen (liste d'examen), ISO yyyy-MM-dd */
  dernierExamen: string
  /** Date d'expiration du dossier (dernier examen + 1 an), ISO yyyy-MM-dd */
  expiration: string
  /** Jours restants avant expiration (négatif si déjà expiré). */
  daysUntilExpiration: number
}

function toDateOnlyIso(d: Date): string {
  const day = calendarDayUtc(d)
  return day.toISOString().slice(0, 10)
}

function addOneCalendarYear(day: Date): Date {
  const d = calendarDayUtc(day)
  return new Date(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate()))
}

function daysUntilCalendar(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil(
    (calendarDayUtc(to).getTime() - calendarDayUtc(from).getTime()) / msPerDay,
  )
}

/**
 * Dossier candidat : valable 1 an après la date du dernier examen officiel
 * (date d'examen de la liste sur laquelle l'élève est inscrit).
 */
export async function getEleveDossierExpirationSummary(
  autoEcoleId: string,
  now: Date = new Date(),
): Promise<EleveDossierExpirationSummary[]> {
  const rows = await prisma.listeExamenCandidat.findMany({
    where: {
      eleve: {
        autoEcoleId,
        statutFormation: { not: "valide" },
      },
    },
    select: {
      eleveId: true,
      eleve: { select: { prenom: true, nom: true } },
      listeExamen: { select: { dateExamen: true } },
    },
  })

  const byEleve = new Map<
    string,
    { eleveId: string; prenom: string; nom: string; lastExam: Date }
  >()

  for (const row of rows) {
    const examDate = calendarDayUtc(row.listeExamen.dateExamen)
    const existing = byEleve.get(row.eleveId)
    if (!existing) {
      byEleve.set(row.eleveId, {
        eleveId: row.eleveId,
        prenom: row.eleve.prenom,
        nom: row.eleve.nom,
        lastExam: examDate,
      })
      continue
    }
    if (examDate.getTime() > existing.lastExam.getTime()) {
      existing.lastExam = examDate
    }
  }

  const today = calendarDayUtc(now)
  const alerts: EleveDossierExpirationSummary[] = []

  for (const entry of byEleve.values()) {
    const expiration = addOneCalendarYear(entry.lastExam)
    const daysUntilExpiration = daysUntilCalendar(today, expiration)

    if (daysUntilExpiration > DOSSIER_ALERT_DAYS_BEFORE) continue

    alerts.push({
      eleveId: entry.eleveId,
      prenom: entry.prenom,
      nom: entry.nom,
      dernierExamen: toDateOnlyIso(entry.lastExam),
      expiration: toDateOnlyIso(expiration),
      daysUntilExpiration,
    })
  }

  return alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
}
