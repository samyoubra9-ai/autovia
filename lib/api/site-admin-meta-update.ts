import type { AutoEcole, SubscriptionPlan } from "@prisma/client"
import type { SiteAdminAccessPatchBody } from "@/lib/api/site-admin-access-update"

const VALID_PLANS = new Set<SubscriptionPlan>([
  "ESSENTIEL",
  "ESSENTIEL_CONNECT",
  "PRO",
  "ELITE",
])

export function isSiteAdminMetaOnlyPatch(body: SiteAdminAccessPatchBody): boolean {
  if (body.action !== undefined || body.subscriptionStatus !== undefined) {
    return false
  }
  return (
    body.adminNotes !== undefined ||
    body.paidUntil !== undefined ||
    body.nom !== undefined ||
    body.ville !== undefined ||
    body.telephone !== undefined ||
    body.emailContact !== undefined ||
    body.subscriptionPlan !== undefined ||
    body.maxElevesOverride !== undefined
  )
}

function parseSubscriptionPlan(raw: unknown): SubscriptionPlan | null {
  if (raw === null || raw === "") return null
  const p = String(raw).trim().toUpperCase() as SubscriptionPlan
  if (!VALID_PLANS.has(p)) {
    throw new Error("Plan invalide (Essentiel, Essentiel Connect, Pro ou Élite).")
  }
  return p
}

function parseMaxElevesOverride(
  raw: unknown,
  currentEleveCount: number,
): number | null {
  if (raw === null || raw === "") return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("Quota override invalide (entier ≥ 1).")
  }
  const rounded = Math.round(n)
  if (rounded < currentEleveCount) {
    throw new Error(
      `Le quota ne peut pas être inférieur aux ${currentEleveCount} dossier(s) actuel(s).`,
    )
  }
  return rounded
}

export function buildSiteAdminMetaUpdateData(
  body: SiteAdminAccessPatchBody,
  ae: AutoEcole & { _count?: { eleves: number } },
): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const currentEleves = ae._count?.eleves ?? 0

  if (body.adminNotes !== undefined) {
    data.adminNotes = String(body.adminNotes).trim() || null
  }

  if (body.nom !== undefined) {
    const nom = String(body.nom).trim()
    if (nom.length < 2) throw new Error("Nom d'auto-école trop court.")
    data.nom = nom
  }

  if (body.ville !== undefined) {
    data.ville = String(body.ville).trim() || null
  }

  if (body.telephone !== undefined) {
    data.telephone = String(body.telephone).trim() || null
  }

  if (body.emailContact !== undefined) {
    const email = String(body.emailContact).trim()
    data.emailContact = email || null
  }

  if (body.paidUntil !== undefined) {
    if (body.paidUntil === null || body.paidUntil === "") {
      data.paidUntil = null
    } else {
      const d = new Date(body.paidUntil)
      if (Number.isNaN(d.getTime())) {
        throw new Error("Date de fin d'abonnement invalide.")
      }
      data.paidUntil = d
      if (d > new Date()) {
        data.subscriptionStatus = "ACTIVE"
      }
    }
  }

  if (body.subscriptionPlan !== undefined) {
    data.subscriptionPlan = parseSubscriptionPlan(body.subscriptionPlan)
  }

  if (body.maxElevesOverride !== undefined) {
    data.maxElevesOverride = parseMaxElevesOverride(body.maxElevesOverride, currentEleves)
  }

  return data
}
