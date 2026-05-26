import { getTrialEndsAt } from "@/lib/auth-utils"
import type { AutoEcole, SubscriptionStatus } from "@prisma/client"

export type SiteAdminAccessAction =
  | "block"
  | "resume_trial"
  | "trial_new"
  | "extend_trial"
  | "unlock_paid"
  | "resume_paid"
  | "cancel"

export type SiteAdminAccessPatchBody = {
  /** Préféré : action explicite */
  action?: SiteAdminAccessAction
  /** Rétrocompatibilité UI ancienne */
  subscriptionStatus?: SubscriptionStatus
  /** Jours ajoutés (extend_trial), défaut 7 */
  extendTrialDays?: number
  paidUntil?: string | null
  adminNotes?: string
}

export function getTrialDaysLeft(trialEndsAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000))
}

export function getPaidDaysLeft(paidUntil: Date | null, now: Date = new Date()): number | null {
  if (!paidUntil) return null
  return Math.max(0, Math.ceil((paidUntil.getTime() - now.getTime()) / 86_400_000))
}

export function canResumeTrial(ae: Pick<AutoEcole, "trialEndsAt">, now: Date = new Date()): boolean {
  return ae.trialEndsAt > now
}

export function canResumePaid(
  ae: Pick<AutoEcole, "paidUntil" | "subscriptionStatus">,
  now: Date = new Date(),
): boolean {
  return Boolean(ae.paidUntil && ae.paidUntil > now)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function resolveSiteAdminAccessAction(
  ae: AutoEcole,
  body: SiteAdminAccessPatchBody,
): SiteAdminAccessAction {
  if (body.action) return body.action

  const status = body.subscriptionStatus
  if (status === "EXPIRED") return "block"
  if (status === "CANCELLED") return "cancel"
  if (status === "ACTIVE") {
    if (
      (ae.subscriptionStatus === "EXPIRED" || ae.subscriptionStatus === "CANCELLED") &&
      canResumePaid(ae)
    ) {
      return "resume_paid"
    }
    return "unlock_paid"
  }
  if (status === "TRIAL") {
    return canResumeTrial(ae) ? "resume_trial" : "trial_new"
  }
  throw new Error("action ou subscriptionStatus requis")
}

export function applySiteAdminAccessUpdate(
  ae: AutoEcole,
  body: SiteAdminAccessPatchBody,
): {
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: Date
  paidUntil: Date | null
  message: string
} {
  const action = resolveSiteAdminAccessAction(ae, body)
  let trialEndsAt = ae.trialEndsAt
  let paidUntil = ae.paidUntil
  const now = new Date()

  switch (action) {
    case "block":
      return {
        subscriptionStatus: "EXPIRED",
        trialEndsAt,
        paidUntil,
        message: (() => {
          const parts: string[] = ["Accès bloqué."]
          if (canResumeTrial(ae, now)) {
            parts.push(
              `Essai conservé : ${getTrialDaysLeft(trialEndsAt, now)} j restant(s) (reprise possible).`,
            )
          }
          if (canResumePaid(ae, now) && paidUntil) {
            parts.push(`Abonnement payé conservé jusqu'au ${paidUntil.toLocaleDateString("fr-FR")}.`)
          }
          return parts.join(" ")
        })(),
      }

    case "resume_trial": {
      if (!canResumeTrial(ae, now)) {
        throw new Error("L'essai est déjà terminé. Utilisez « Nouvel essai 15 j » ou prolongez.")
      }
      const days = getTrialDaysLeft(trialEndsAt, now)
      return {
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        paidUntil: null,
        message: `Essai repris — il reste ${days} jour${days > 1 ? "s" : ""} (jusqu'au ${trialEndsAt.toLocaleDateString("fr-FR")}).`,
      }
    }

    case "trial_new":
      trialEndsAt = getTrialEndsAt(now)
      return {
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        paidUntil: null,
        message: "Nouvel essai gratuit de 15 jours activé.",
      }

    case "extend_trial": {
      const extra = Math.max(1, Math.min(90, Number(body.extendTrialDays) || 7))
      const base = trialEndsAt > now ? trialEndsAt : now
      trialEndsAt = addDays(base, extra)
      return {
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        paidUntil: null,
        message: `Essai prolongé de ${extra} jours (fin le ${trialEndsAt.toLocaleDateString("fr-FR")}).`,
      }
    }

    case "unlock_paid": {
      const raw = body.paidUntil
      paidUntil = raw ? new Date(String(raw)) : null
      return {
        subscriptionStatus: "ACTIVE",
        trialEndsAt,
        paidUntil,
        message: paidUntil
          ? `Accès débloqué (payé) jusqu'au ${paidUntil.toLocaleDateString("fr-FR")}.`
          : "Accès débloqué (abonnement actif, sans date de fin).",
      }
    }

    case "resume_paid": {
      if (!canResumePaid(ae, now)) {
        throw new Error("Aucun abonnement payé en cours à reprendre.")
      }
      const days = getPaidDaysLeft(paidUntil, now)!
      return {
        subscriptionStatus: "ACTIVE",
        trialEndsAt,
        paidUntil,
        message: `Abonnement repris — ${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}.`,
      }
    }

    case "cancel":
      return {
        subscriptionStatus: "CANCELLED",
        trialEndsAt,
        paidUntil,
        message: "Compte annulé (dates conservées en base).",
      }

    default:
      throw new Error("Action inconnue.")
  }
}
