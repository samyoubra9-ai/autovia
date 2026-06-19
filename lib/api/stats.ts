import { prisma } from "@/lib/prisma"
import { resolveDisplayStatut } from "@/lib/api/seances"

export async function getDashboardStats(autoEcoleId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [eleves, paiements, seances, vehicules] = await Promise.all([
    prisma.eleve.findMany({
      where: { autoEcoleId, statutInscription: "VALIDE" },
      select: {
        id: true,
        prixPermis: true,
        createdAt: true,
        etapeExamenValidee: true,
        etapeCodeValidee: true,
        etapeCreneauValidee: true,
        etapeCirculationValidee: true,
        statutFormation: true,
      },
    }),
    prisma.paiement.findMany({
      where: { autoEcoleId },
      select: { montant: true, createdAt: true, eleveId: true },
    }),
    prisma.seanceExamen.findMany({
      where: { autoEcoleId },
      select: { dateHeure: true, statut: true },
    }),
    prisma.vehicule.findMany({
      where: { autoEcoleId },
      select: {
        id: true,
        marque: true,
        modele: true,
        matricule: true,
        assuranceExpiration: true,
        controleTechniqueExpiration: true,
      },
    }),
  ])

  const paiementsByEleve = new Map<string, number>()
  for (const p of paiements) {
    paiementsByEleve.set(p.eleveId, (paiementsByEleve.get(p.eleveId) ?? 0) + p.montant)
  }

  let resteAPercevoir = 0
  let impayesCount = 0
  let previsionTotale = 0
  for (const e of eleves) {
    const paye = paiementsByEleve.get(e.id) ?? 0
    const reste = Math.max(0, e.prixPermis - paye)
    resteAPercevoir += reste
    previsionTotale += e.prixPermis
    if (reste > 0) impayesCount++
  }

  const encaissementsMois = paiements
    .filter((p) => p.createdAt >= monthStart && p.createdAt <= monthEnd)
    .reduce((s, p) => s + p.montant, 0)

  const nouveauxElevesMois = eleves.filter(
    (e) => e.createdAt >= monthStart && e.createdAt <= monthEnd,
  ).length

  const seancesAVenir = seances.filter((s) => {
    const display = resolveDisplayStatut(s.statut, s.dateHeure)
    return display === "planifie" && s.dateHeure >= now
  }).length

  const examensReussis = eleves.filter((e) => e.etapeExamenValidee).length
  const tauxReussiteEstime =
    eleves.length > 0 ? Math.round((examensReussis / eleves.length) * 100) : 0

  const parStatutFormation = {
    code: eleves.filter((e) => e.statutFormation === "code").length,
    creneau: eleves.filter((e) => e.statutFormation === "creneau").length,
    circulation: eleves.filter((e) => e.statutFormation === "circulation").length,
    valide: eleves.filter((e) => e.statutFormation === "valide").length,
  }

  const vehicleAlerts = vehicules.flatMap((v) => {
    const alerts: Array<{
      vehiculeId: string
      label: string
      type: "assurance" | "controle_technique"
      daysLeft: number
      level: "warning" | "critical"
    }> = []
    const name = v.matricule ?? `${v.marque} ${v.modele}`

    for (const [type, date] of [
      ["assurance", v.assuranceExpiration],
      ["controle_technique", v.controleTechniqueExpiration],
    ] as const) {
      if (!date) continue
      const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 30) {
        alerts.push({
          vehiculeId: v.id,
          label: name,
          type,
          daysLeft,
          level: daysLeft <= 7 ? "critical" : "warning",
        })
      }
    }
    return alerts
  })

  vehicleAlerts.sort((a, b) => a.daysLeft - b.daysLeft)

  const paiementsParMois: { mois: string; montant: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
    const montant = paiements
      .filter((p) => p.createdAt >= start && p.createdAt <= end)
      .reduce((s, p) => s + p.montant, 0)
    paiementsParMois.push({
      mois: start.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      montant,
    })
  }

  return {
    nouveauxElevesMois,
    encaissementsMois,
    resteAPercevoir,
    previsionTotale,
    impayesCount,
    seancesAVenir,
    tauxReussiteEstime,
    examensReussis,
    totalEleves: eleves.length,
    parStatutFormation,
    vehicleAlerts,
    paiementsParMois,
  }
}
