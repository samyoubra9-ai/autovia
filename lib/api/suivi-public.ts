import { ApiError } from "@/lib/api/errors"
import { getEtapesValidees } from "@/lib/api/formation"
import { formatCodeSuiviDisplay, normalizeCodeSuivi } from "@/lib/api/code-suivi"
import { NATURE_EXAMEN_AR } from "@/lib/api/liste-examen"
import {
  formatResultatPrint,
  parseResultatStored,
} from "@/lib/api/resultat-examen-candidat"
import { listeExamenGroupKey } from "@/lib/api/liste-examen-groups"
import { resolveDisplayStatut } from "@/lib/api/seances"
import { SEANCE_TYPE_LABELS } from "@/lib/api/seance-type"
import { safeMapSync } from "@/lib/api/safe"
import { prisma } from "@/lib/prisma"
import type { NatureExamenListe, SeanceStatut, SeanceType } from "@prisma/client"

/** Étapes visibles côté candidat (sans « examen » — fin du parcours = circulation validée). */
const ETAPES_PUBLIC = ["code", "creneau", "circulation"] as const

const ETAPE_LABELS: Record<(typeof ETAPES_PUBLIC)[number], string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
}

function getProgressPercentPublic(eleve: {
  etapeCodeValidee: boolean
  etapeCreneauValidee: boolean
  etapeCirculationValidee: boolean
}) {
  const v = getEtapesValidees(eleve)
  const done = ETAPES_PUBLIC.filter((e) => v[e]).length
  return Math.round((done / ETAPES_PUBLIC.length) * 100)
}

export type SuiviPublicDto = {
  codeSuivi: string
  codeSuiviDisplay: string
  autoEcole: { nom: string }
  candidat: {
    prenom: string
    nom: string
    identifiant: string
    categoriePermis: string
    statutFormation: string
  }
  parcours: {
    progressionPercent: number
    /** true lorsque la circulation est validée par le moniteur (parcours candidat terminé). */
    formationTerminee: boolean
    etapes: Array<{
      code: (typeof ETAPES_PUBLIC)[number]
      label: string
      validee: boolean
    }>
  }
  finance: {
    prixPermis: number
    totalPaye: number
    resteAPayer: number
  }
  seances: Array<{
    id: string
    type: SeanceType
    typeLabel: string
    dateHeure: string
    statut: SeanceStatut
    statutAffichage: SeanceStatut
    messageCandidat: string | null
    notes: string | null
  }>
  examensOfficiels: Array<{
    id: string
    dateExamen: string
    centreExamen: string
    wilaya: string
    natureExamen: string
    natureLabel: string
    resultat: string | null
    resultatLabel: string | null
    messageCategorie: string | null
    heureConvocation: string | null
  }>
  notifications: Array<{
    id: string
    type: "seance" | "examen" | "paiement" | "parcours"
    title: string
    message: string
    at: string | null
    urgent: boolean
  }>
}

const STATUT_FORMATION_LABELS: Record<string, string> = {
  code: "Code de la route",
  creneau: "Créneau",
  circulation: "Circulation",
  valide: "Formation validée",
}

export async function getSuiviPublicByCode(rawCode: string): Promise<SuiviPublicDto> {
  const code = normalizeCodeSuivi(rawCode)
  if (code.length < 6) {
    throw new ApiError(400, "Code de suivi invalide.")
  }

  let eleve: Awaited<ReturnType<typeof loadEleveSuivi>>
  try {
    eleve = await loadEleveSuivi(code)
  } catch (error) {
    const msg = String((error as Error)?.message ?? "")
    if (msg.includes("type") && msg.includes("seances_examen")) {
      eleve = await loadEleveSuivi(code, { omitSeanceType: true })
    } else {
      throw error
    }
  }

  if (!eleve) {
    throw new ApiError(404, "Aucun dossier trouvé pour ce code. Vérifiez le code ou contactez votre auto-école.")
  }

  const etapesValidees = getEtapesValidees(eleve)
  const formationTerminee = Boolean(eleve.etapeCirculationValidee)
  const totalPaye = (eleve.paiements ?? []).reduce((s, p) => s + (p.montant ?? 0), 0)
  const prixPermis = eleve.prixPermis ?? 0
  const resteAPayer = Math.max(0, prixPermis - totalPaye)
  const codeSuivi = eleve.codeSuivi ?? code

  const seances = safeMapSync(eleve.seancesExamen ?? [], (s) => {
    try {
      if (!s?.id) return null
      const dateHeure =
        s.dateHeure instanceof Date && !Number.isNaN(s.dateHeure.getTime())
          ? s.dateHeure
          : new Date()
      const statut = (s.statut ?? "planifie") as SeanceStatut
      const type = ((s as { type?: SeanceType }).type ?? "code") as SeanceType
      const messageCandidat = trimPublicText(
        (s as { messageCandidat?: string | null }).messageCandidat,
      )
      const notes = trimPublicText((s as { notes?: string | null }).notes)
      return {
        id: s.id,
        type,
        typeLabel: SEANCE_TYPE_LABELS[type] ?? type,
        dateHeure: dateHeure.toISOString(),
        statut,
        statutAffichage: resolveDisplayStatut(statut, dateHeure),
        messageCandidat,
        notes,
      }
    } catch {
      return null
    }
  }, "seance")

  const eleveGroupKey = listeExamenGroupKey(eleve.categoriePermis?.code ?? "")
  const examensOfficiels = buildExamensOfficiels(
    eleve.listeExamenCandidats ?? [],
    eleveGroupKey,
  )

  const dto: SuiviPublicDto = {
    codeSuivi,
    codeSuiviDisplay: formatCodeSuiviDisplay(codeSuivi),
    autoEcole: { nom: eleve.autoEcole?.nom ?? "Auto-école" },
    candidat: {
      prenom: eleve.prenom ?? "",
      nom: eleve.nom ?? "",
      identifiant: eleve.identifiant ?? "",
      categoriePermis: String(eleve.categoriePermis?.libelleFr ?? eleve.categoriePermis?.code ?? ""),
      statutFormation: String(eleve.statutFormation ?? ""),
    },
    parcours: {
      progressionPercent: formationTerminee ? 100 : getProgressPercentPublic(eleve),
      formationTerminee,
      etapes: formationTerminee
        ? []
        : ETAPES_PUBLIC.map((step) => ({
            code: step,
            label: ETAPE_LABELS[step],
            validee: etapesValidees[step] ?? false,
          })),
    },
    finance: {
      prixPermis,
      totalPaye,
      resteAPayer,
    },
    seances,
    examensOfficiels,
    notifications: [],
  }
  dto.notifications = buildNotifications(dto)
  return dto
}

function formatDateListe(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

function trimPublicText(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

type ListeCandidatRow = {
  id: string
  natureExamen: NatureExamenListe
  resultat: string | null
  listeExamen: {
    dateExamen: Date
    centreExamen: string
    wilaya: string
    messagesCategorie?: Array<{
      message: string | null
      heureConvocation: string | null
      categoriePermis: { code: string }
    }>
  }
}

function messageForEleveGroup(
  messages: ListeCandidatRow["listeExamen"]["messagesCategorie"] | undefined,
  eleveGroupKey: string,
): { message: string | null; heureConvocation: string | null } {
  if (!messages?.length) return { message: null, heureConvocation: null }
  const row = messages.find(
    (m) => listeExamenGroupKey(m.categoriePermis.code) === eleveGroupKey,
  )
  if (!row) return { message: null, heureConvocation: null }
  return {
    message: trimPublicText(row.message),
    heureConvocation: trimPublicText(row.heureConvocation),
  }
}

function buildExamensOfficiels(rows: ListeCandidatRow[], eleveGroupKey: string) {
  return rows
    .map((row) => {
      const d = row.listeExamen?.dateExamen
      if (!d || Number.isNaN(d.getTime())) return null
      const nature = row.natureExamen
      const resultat = parseResultatStored(row.resultat)
      const msg = messageForEleveGroup(
        row.listeExamen.messagesCategorie,
        eleveGroupKey,
      )
      return {
        id: row.id,
        dateExamen: formatDateListe(d),
        centreExamen: row.listeExamen.centreExamen ?? "",
        wilaya: row.listeExamen.wilaya ?? "",
        natureExamen: String(nature),
        natureLabel: NATURE_EXAMEN_AR[nature] ?? String(nature),
        resultat,
        resultatLabel: resultat ? formatResultatPrint(resultat) : null,
        messageCategorie: msg.message,
        heureConvocation: msg.heureConvocation,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.dateExamen.localeCompare(a.dateExamen))
}

function buildNotifications(dto: SuiviPublicDto): SuiviPublicDto["notifications"] {
  const items: SuiviPublicDto["notifications"] = []
  const now = Date.now()
  const in48h = now + 48 * 60 * 60 * 1000

  for (const s of dto.seances) {
    if (s.statut === "annule") continue
    const t = new Date(s.dateHeure).getTime()
    if (t < now - 30 * 60 * 1000) continue
    const urgent = t <= in48h && s.statutAffichage === "planifie"
    const custom = s.messageCandidat ?? s.notes
    items.push({
      id: `seance-${s.id}`,
      type: "seance",
      title: urgent ? "Séance prochainement" : "Séance planifiée",
      message: custom
        ? custom
        : `${s.typeLabel} — ${formatNotifDate(s.dateHeure)}`,
      at: s.dateHeure,
      urgent,
    })
  }

  for (const ex of dto.examensOfficiels) {
    const at = parseListeDate(ex.dateExamen)
    const hasResult = Boolean(ex.resultat)
    const convocParts: string[] = []
    if (ex.heureConvocation) convocParts.push(`à ${ex.heureConvocation}`)
    if (ex.messageCategorie) convocParts.push(ex.messageCategorie)
    const convoc = convocParts.length ? convocParts.join(" — ") : null
    items.push({
      id: `examen-${ex.id}`,
      type: "examen",
      title: hasResult ? "Résultat d'examen" : "Examen officiel",
      message: hasResult
        ? `${ex.natureLabel} — ${ex.resultatLabel ?? ex.resultat}`
        : convoc ??
          `${ex.natureLabel} le ${ex.dateExamen} · ${ex.centreExamen}`,
      at: at?.toISOString() ?? null,
      urgent: !hasResult && at !== null && at.getTime() <= in48h && at.getTime() >= now,
    })
  }

  if (dto.finance.resteAPayer > 0) {
    items.push({
      id: "paiement-reste",
      type: "paiement",
      title: "Solde permis",
      message: `Reste à régler : ${dto.finance.resteAPayer.toLocaleString("fr-DZ")} DZD`,
      at: null,
      urgent: dto.finance.resteAPayer > dto.finance.prixPermis * 0.5,
    })
  }

  if (dto.parcours.formationTerminee) {
    items.push({
      id: "parcours-felicitations",
      type: "parcours",
      title: "Félicitations !",
      message:
        "Vous avez validé votre formation. Récupérez votre permis auprès du moniteur qui vous suit.",
      at: null,
      urgent: false,
    })
  } else {
    const etapeCourante = dto.candidat.statutFormation
    const label = STATUT_FORMATION_LABELS[etapeCourante] ?? etapeCourante
    items.push({
      id: "parcours-etape",
      type: "parcours",
      title: "Étape en cours",
      message: `Vous êtes en formation : ${label}`,
      at: null,
      urgent: false,
    })
  }

  return items.sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    const ta = a.at ? new Date(a.at).getTime() : 0
    const tb = b.at ? new Date(b.at).getTime() : 0
    return tb - ta
  })
}

function formatNotifDate(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function parseListeDate(slashDate: string): Date | null {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(slashDate.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}

async function loadEleveSuivi(code: string, opts?: { omitSeanceType?: boolean }) {
  const seanceSelect = opts?.omitSeanceType
    ? {
        id: true,
        dateHeure: true,
        statut: true,
        messageCandidat: true,
        notes: true,
      }
    : {
        id: true,
        type: true,
        dateHeure: true,
        statut: true,
        messageCandidat: true,
        notes: true,
      }

  return prisma.eleve.findFirst({
    where: { codeSuivi: code },
    include: {
      categoriePermis: { select: { code: true, libelleFr: true } },
      autoEcole: { select: { nom: true } },
      paiements: { select: { montant: true } },
      seancesExamen: {
        orderBy: { dateHeure: "asc" },
        select: seanceSelect,
      },
      listeExamenCandidats: {
        orderBy: { listeExamen: { dateExamen: "desc" } },
        select: {
          id: true,
          natureExamen: true,
          resultat: true,
          listeExamen: {
            select: {
              dateExamen: true,
              centreExamen: true,
              wilaya: true,
              messagesCategorie: {
                select: {
                  message: true,
                  heureConvocation: true,
                  categoriePermis: { select: { code: true } },
                },
              },
            },
          },
        },
      },
    },
  })
}
