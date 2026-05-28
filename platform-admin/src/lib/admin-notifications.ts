import { differenceInCalendarDays, isAfter, parseISO } from 'date-fns'
import type { SiteAdminAutoEcoleRow } from '@/types/admin'

/** Jours avant échéance pour alerter l'admin */
export const SUBSCRIPTION_WARN_DAYS = 2

export type AdminNotificationType =
  | 'trial_expiring'
  | 'subscription_expiring'
  | 'trial_ended'
  | 'subscription_ended'
  | 'new_client'
  | 'awaiting_activation'

export type AdminNotificationPriority = 'high' | 'medium' | 'low'

export type AdminNotification = {
  id: string
  type: AdminNotificationType
  priority: AdminNotificationPriority
  autoEcoleId: string
  title: string
  message: string
  createdAt: string
  /** ISO date de l'échéance concernée */
  dueAt?: string
  daysLeft?: number
}

function daysUntil(iso: string, now = new Date()): number {
  return differenceInCalendarDays(parseISO(iso), now)
}

export function buildAdminNotifications(
  rows: SiteAdminAutoEcoleRow[],
  now = new Date(),
): AdminNotification[] {
  const out: AdminNotification[] = []

  for (const row of rows) {
    if (row.subscriptionStatus === 'TRIAL' && row.hasAccess) {
      const left = daysUntil(row.trialEndsAt, now)
      if (left >= 0 && left <= SUBSCRIPTION_WARN_DAYS) {
        out.push({
          id: `trial_expiring-${row.id}`,
          type: 'trial_expiring',
          priority: left <= 1 ? 'high' : 'medium',
          autoEcoleId: row.id,
          title: `Essai bientôt terminé — ${row.nom}`,
          message:
            left === 0
              ? "L'essai se termine aujourd'hui."
              : `Il reste ${left} jour${left > 1 ? 's' : ''} d'essai gratuit.`,
          createdAt: now.toISOString(),
          dueAt: row.trialEndsAt,
          daysLeft: left,
        })
      }
    }

    if (row.subscriptionStatus === 'TRIAL' && !row.hasAccess) {
      out.push({
        id: `trial_ended-${row.id}`,
        type: 'trial_ended',
        priority: 'medium',
        autoEcoleId: row.id,
        title: `Essai terminé — ${row.nom}`,
        message: "L'accès backdash est coupé. Prolongez l'essai ou débloquez (payé).",
        createdAt: now.toISOString(),
        dueAt: row.trialEndsAt,
      })
    }

    if (row.subscriptionStatus === 'ACTIVE' && row.paidUntil && row.hasAccess) {
      const left = daysUntil(row.paidUntil, now)
      if (left >= 0 && left <= SUBSCRIPTION_WARN_DAYS) {
        out.push({
          id: `subscription_expiring-${row.id}`,
          type: 'subscription_expiring',
          priority: left <= 1 ? 'high' : 'medium',
          autoEcoleId: row.id,
          title: `Abonnement bientôt expiré — ${row.nom}`,
          message:
            left === 0
              ? "L'abonnement payé se termine aujourd'hui."
              : `Il reste ${left} jour${left > 1 ? 's' : ''} avant expiration.`,
          createdAt: now.toISOString(),
          dueAt: row.paidUntil,
          daysLeft: left,
        })
      }
      if (isAfter(now, parseISO(row.paidUntil))) {
        out.push({
          id: `subscription_ended-${row.id}`,
          type: 'subscription_ended',
          priority: 'high',
          autoEcoleId: row.id,
          title: `Abonnement expiré — ${row.nom}`,
          message: "Renouvelez la date de fin ou bloquez l'accès.",
          createdAt: now.toISOString(),
          dueAt: row.paidUntil,
        })
      }
    }

    if (!row.hasAccess && row.canResumeTrial) {
      out.push({
        id: `trial_resumable-${row.id}`,
        type: 'trial_ended',
        priority: 'medium',
        autoEcoleId: row.id,
        title: `Essai en pause — ${row.nom}`,
        message: `Bloqué mais ${row.trialDaysLeft ?? 0} jour(s) d'essai restant(s). Utilisez « Reprendre l'essai ».`,
        createdAt: now.toISOString(),
        dueAt: row.trialEndsAt,
        daysLeft: row.trialDaysLeft ?? undefined,
      })
    }

    if (row.subscriptionStatus === 'EXPIRED' && !row.hasAccess && !row.canResumeTrial) {
      const createdDays = -daysUntil(row.createdAt, now)
      if (createdDays <= 14) {
        out.push({
          id: `awaiting_activation-${row.id}`,
          type: 'awaiting_activation',
          priority: 'low',
          autoEcoleId: row.id,
          title: `En attente d'activation — ${row.nom}`,
          message: 'Compte créé mais accès backdash toujours bloqué.',
          createdAt: now.toISOString(),
        })
      }
    }

    const hoursSinceCreate = (now.getTime() - parseISO(row.createdAt).getTime()) / 3_600_000
    if (hoursSinceCreate <= 48) {
      out.push({
        id: `new_client-${row.id}`,
        type: 'new_client',
        priority: 'low',
        autoEcoleId: row.id,
        title: `Nouveau client — ${row.nom}`,
        message: row.owner
          ? `Owner : ${row.owner.prenom} ${row.owner.nom} (${row.owner.email})`
          : 'Nouvelle auto-école inscrite.',
        createdAt: row.createdAt,
      })
    }
  }

  const priorityOrder: Record<AdminNotificationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  return out.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}
