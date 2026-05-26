import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import {
  canResumePaid,
  canResumeTrial,
  getPaidDaysLeft,
  getTrialDaysLeft,
} from "@/lib/api/site-admin-access-update"
import type { SubscriptionStatus } from "@prisma/client"

export type SiteAdminAutoEcoleDto = {
  id: string
  nom: string
  slug: string
  ville: string | null
  telephone: string | null
  emailContact: string | null
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string
  paidUntil: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  hasAccess: boolean
  accessDetail: string
  owner: { prenom: string; nom: string; email: string } | null
  counts: {
    eleves: number
    users: number
    moniteurs: number
    vehicules: number
    listesExamen: number
  }
  trialDaysLeft: number | null
  paidDaysLeft: number | null
  canResumeTrial: boolean
  canResumePaid: boolean
}

export type SiteAdminDashboardStats = {
  total: number
  active: number
  blocked: number
  trial: number
  expired: number
  cancelled: number
  newLast7Days: number
  newLast30Days: number
}

export function toSiteAdminAutoEcoleDto(
  ae: {
    id: string
    nom: string
    slug: string
    ville: string | null
    telephone: string | null
    emailContact: string | null
    subscriptionStatus: SubscriptionStatus
    trialEndsAt: Date
    paidUntil: Date | null
    adminNotes: string | null
    createdAt: Date
    updatedAt: Date
    users: Array<{ prenom: string; nom: string; email: string }>
    _count?: {
      eleves: number
      users: number
      moniteurs: number
      vehicules: number
      listesExamen: number
    }
  },
  now: Date = new Date(),
): SiteAdminAutoEcoleDto {
  const owner = ae.users[0] ?? null
  const accessInput = {
    subscriptionStatus: ae.subscriptionStatus,
    trialEndsAt: ae.trialEndsAt,
    paidUntil: ae.paidUntil,
  }
  const trialLeft = getTrialDaysLeft(ae.trialEndsAt, now)
  const paidLeft = getPaidDaysLeft(ae.paidUntil, now)
  return {
    id: ae.id,
    nom: ae.nom,
    slug: ae.slug,
    ville: ae.ville,
    telephone: ae.telephone,
    emailContact: ae.emailContact,
    subscriptionStatus: ae.subscriptionStatus,
    trialEndsAt: ae.trialEndsAt.toISOString(),
    paidUntil: ae.paidUntil?.toISOString() ?? null,
    adminNotes: ae.adminNotes,
    createdAt: ae.createdAt.toISOString(),
    updatedAt: ae.updatedAt.toISOString(),
    hasAccess: hasAutoEcoleAccess(accessInput),
    accessDetail: getAccessDetail(accessInput),
    owner: owner
      ? { prenom: owner.prenom, nom: owner.nom, email: owner.email }
      : null,
    counts: {
      eleves: ae._count?.eleves ?? 0,
      users: ae._count?.users ?? 0,
      moniteurs: ae._count?.moniteurs ?? 0,
      vehicules: ae._count?.vehicules ?? 0,
      listesExamen: ae._count?.listesExamen ?? 0,
    },
    trialDaysLeft: trialLeft > 0 ? trialLeft : null,
    paidDaysLeft: paidLeft,
    canResumeTrial: canResumeTrial(ae, now),
    canResumePaid: canResumePaid(ae, now),
  }
}

export function buildSiteAdminStats(
  rows: SiteAdminAutoEcoleDto[],
  now: Date = new Date(),
): SiteAdminDashboardStats {
  const day7 = new Date(now)
  day7.setDate(day7.getDate() - 7)
  const day30 = new Date(now)
  day30.setDate(day30.getDate() - 30)

  return {
    total: rows.length,
    active: rows.filter((r) => r.hasAccess).length,
    blocked: rows.filter((r) => !r.hasAccess && r.subscriptionStatus === "EXPIRED").length,
    trial: rows.filter((r) => r.subscriptionStatus === "TRIAL").length,
    expired: rows.filter((r) => r.subscriptionStatus === "EXPIRED").length,
    cancelled: rows.filter((r) => r.subscriptionStatus === "CANCELLED").length,
    newLast7Days: rows.filter((r) => new Date(r.createdAt) >= day7).length,
    newLast30Days: rows.filter((r) => new Date(r.createdAt) >= day30).length,
  }
}
