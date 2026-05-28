import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ClientFilter, SiteAdminAutoEcoleRow } from '@/types/admin'
import type { SubscriptionStatus } from '@/lib/site-admin-access'

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Actif (payé)',
  TRIAL: 'Essai',
  EXPIRED: 'Bloqué',
  CANCELLED: 'Annulé',
}

export function formatClientDate(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy', { locale: fr })
}

export function formatRelativeDate(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr })
}

export function filterClients(
  rows: SiteAdminAutoEcoleRow[],
  filter: ClientFilter,
  search: string,
): SiteAdminAutoEcoleRow[] {
  const q = search.trim().toLowerCase()
  const now = Date.now()
  const day7 = now - 7 * 24 * 60 * 60 * 1000
  const day30 = now - 30 * 24 * 60 * 60 * 1000

  return rows.filter((row) => {
    if (filter === 'active' && !row.hasAccess) return false
    if (filter === 'blocked' && row.hasAccess) return false
    if (filter === 'trial' && row.subscriptionStatus !== 'TRIAL') return false
    if (filter === 'expired' && row.subscriptionStatus !== 'EXPIRED') return false
    if (filter === 'new7' && new Date(row.createdAt).getTime() < day7) return false
    if (filter === 'new30' && new Date(row.createdAt).getTime() < day30) return false

    if (!q) return true
    const hay = [
      row.nom,
      row.slug,
      row.ville,
      row.telephone,
      row.emailContact,
      row.owner?.email,
      row.owner?.prenom,
      row.owner?.nom,
      row.adminNotes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function isNewClient(row: SiteAdminAutoEcoleRow, days = 7): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(row.createdAt).getTime() >= cutoff
}
