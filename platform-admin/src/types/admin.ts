import type { SubscriptionStatus } from '@/lib/site-admin-access'

export type SiteAdminAccessAction =
  | 'block'
  | 'resume_trial'
  | 'trial_new'
  | 'extend_trial'
  | 'unlock_paid'
  | 'resume_paid'
  | 'cancel'

export type SiteAdminAutoEcoleRow = {
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

export type SiteAdminListResponse = {
  autoEcoles: SiteAdminAutoEcoleRow[]
  stats: SiteAdminDashboardStats
}

export type ClientFilter =
  | 'all'
  | 'active'
  | 'blocked'
  | 'trial'
  | 'expired'
  | 'new7'
  | 'new30'
