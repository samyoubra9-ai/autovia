import {
  ensureEngagementsForEleve,
  isEngagementsTableReady,
  loadEngagementsByEleveId,
  type CandidatEngagementDto,
} from "@/lib/api/candidat-engagement"
import { ApiError } from "@/lib/api/errors"
import { getEtapesValidees, getProgressPercent, isParcoursTermine } from "@/lib/api/formation"
import {
  A1_PERMIS_OBTENU_LABEL,
  A1_SUIVI_FELICITATIONS,
  A1_SUIVI_MESSAGE_B_18_ANS,
  isA1CodePhaseComplete,
  isA1Eleve,
} from "@/lib/api/permis-a1"
import { formatCodeSuiviDisplay, normalizeCodeSuivi } from "@/lib/api/code-suivi"
import { formatDateListe, NATURE_EXAMEN_AR } from "@/lib/api/liste-examen"
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

function getProgressPercentPublic(
  eleve: Parameters<typeof getProgressPercent>[0],
) {
  return getProgressPercent(eleve)
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
    /** A1 : permis obtenu au code (parcours clos, message permis B à 18 ans). */
    a1PermisObtenu: boolean
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
    engagement: CandidatEngagementDto | null
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
    engagement: CandidatEngagementDto | null
  }>
  /** false si la migration SQL candidat_engagements n’est pas appliquée */
  confirmationsReady: boolean
  notifications: Array<{
    id: string
    type: "seance" | "examen" | "paiement" | "parcours"
    title: string
    message: string
    at: string | null
    urgent: boolean
    engagementId?: string
    confirmationStatut?: CandidatEngagementDto["statut"]
    requiresConfirmation?: boolean
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
  const formationTerminee = isParcoursTermine(eleve)
  const a1PermisObtenu = isA1Eleve(eleve) && isA1CodePhaseComplete(eleve)
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
        engagement: null as CandidatEngagementDto | null,
      }
    } catch {
      return null
    }
  }, "seance")

  const eleveGroupKey = listeExamenGroupKey(eleve.categoriePermis?.code ?? "")
  const examensOfficiels = buildExamensOfficiels(
    eleve.listeExamenCandidats ?? [],
    eleveGroupKey,
    eleve.sexe === "feminin" ? "feminin" : "masculin",
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
      a1PermisObtenu,
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
    confirmationsReady: false,
  }

  const confirmationsReady = await isEngagementsTableReady()
  dto.confirmationsReady = confirmationsReady
  if (!confirmationsReady) {
    console.warn(
      "[suivi-public] Table candidat_engagements absente — boutons candidat limités",
    )
  }

  if (confirmationsReady) {
    await ensureEngagementsForEleve({
      autoEcoleId: eleve.autoEcoleId,
      eleveId: eleve.id,
      seances: (eleve.seancesExamen ?? []).map((s) => ({
        id: s.id,
        statut: (s.statut ?? "planifie") as SeanceStatut,
        dateHeure:
          s.dateHeure instanceof Date ? s.dateHeure : new Date(s.dateHeure),
      })),
      examens: (eleve.listeExamenCandidats ?? []).map((c) => ({
        id: c.id,
        resultat: c.resultat,
      })),
    })
  }

  const engagements = await loadEngagementsByEleveId(eleve.id)
  const byRef = new Map(
    engagements.map((e) => [`${e.type}:${e.referenceId}`, e] as const),
  )
  for (const s of dto.seances) {
    s.engagement = byRef.get(`seance:${s.id}`) ?? null
  }
  for (const ex of dto.examensOfficiels) {
    ex.engagement = byRef.get(`examen:${ex.id}`) ?? null
  }

  dto.notifications = buildNotifications(dto)
  return dto
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

function buildExamensOfficiels(
  rows: ListeCandidatRow[],
  eleveGroupKey: string,
  sexe: "masculin" | "feminin",
) {
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
        resultatLabel: resultat ? formatResultatPrint(resultat, sexe) : null,
        messageCategorie: msg.message,
        heureConvocation: msg.heureConvocation,
        engagement: null as CandidatEngagementDto | null,
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
    const eng = s.engagement
    const pending = eng?.statut === "en_attente"
    const urgent =
      pending || (t <= in48h && s.statutAffichage === "planifie")
    const custom = s.messageCandidat ?? s.notes
    let title = urgent ? "Séance prochainement" : "Séance planifiée"
    let message = custom
      ? custom
      : `${s.typeLabel} — ${formatNotifDate(s.dateHeure)}`
    if (eng?.statut === "accepte") {
      title = "Séance confirmée"
      message = `Vous avez accepté : ${s.typeLabel} — ${formatNotifDate(s.dateHeure)}`
    } else if (eng?.statut === "refuse") {
      title = "Séance refusée"
      message = eng.motif
        ? `Motif : ${eng.motif}`
        : `Refus enregistré pour ${s.typeLabel}`
    } else if (pending) {
      title = "Confirmer votre présence"
      message = custom
        ? `${custom} — Merci de confirmer ou refuser.`
        : `${s.typeLabel} le ${formatNotifDate(s.dateHeure)} — confirmez votre présence.`
    }
    items.push({
      id: `seance-${s.id}`,
      type: "seance",
      title,
      message,
      at: s.dateHeure,
      urgent,
      engagementId: eng?.id,
      confirmationStatut: eng?.statut,
      requiresConfirmation: pending,
    })
  }

  for (const ex of dto.examensOfficiels) {
    const at = parseListeDate(ex.dateExamen)
    const hasResult = Boolean(ex.resultat)
    const eng = ex.engagement
    const pending = eng?.statut === "en_attente"
    const convocParts: string[] = []
    if (ex.heureConvocation) convocParts.push(`à ${ex.heureConvocation}`)
    if (ex.messageCategorie) convocParts.push(ex.messageCategorie)
    const convoc = convocParts.length ? convocParts.join(" — ") : null
    let title = hasResult ? "Résultat d'examen" : "Examen officiel"
    let message = hasResult
      ? `${ex.natureLabel} — ${ex.resultatLabel ?? ex.resultat}`
      : convoc ??
        `${ex.natureLabel} le ${ex.dateExamen} · ${ex.centreExamen}`
    if (eng?.statut === "accepte") {
      title = "Examen confirmé"
      message = `Vous avez accepté la convocation : ${ex.natureLabel}`
    } else if (eng?.statut === "refuse") {
      title = "Examen refusé"
      message = eng.motif
        ? `Motif : ${eng.motif}`
        : `Refus enregistré pour ${ex.natureLabel}`
    } else if (pending && !hasResult) {
      title = "Confirmer votre convocation"
      message = convoc
        ? `${convoc} — Merci de confirmer ou refuser.`
        : `${ex.natureLabel} le ${ex.dateExamen} — confirmez votre présence.`
    }
    items.push({
      id: `examen-${ex.id}`,
      type: "examen",
      title,
      message,
      at: at?.toISOString() ?? null,
      urgent:
        pending ||
        (!hasResult && at !== null && at.getTime() <= in48h && at.getTime() >= now),
      engagementId: eng?.id,
      confirmationStatut: eng?.statut,
      requiresConfirmation: pending && !hasResult,
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
    if (dto.parcours.a1PermisObtenu) {
      items.push({
        id: "parcours-a1-obtenu",
        type: "parcours",
        title: A1_PERMIS_OBTENU_LABEL,
        message: `${A1_SUIVI_FELICITATIONS} ${A1_SUIVI_MESSAGE_B_18_ANS}`,
        at: null,
        urgent: false,
      })
    } else {
      items.push({
        id: "parcours-felicitations",
        type: "parcours",
        title: "Félicitations !",
        message:
          "Vous avez validé votre formation. Récupérez votre permis auprès du moniteur qui vous suit.",
        at: null,
        urgent: false,
      })
    }
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
