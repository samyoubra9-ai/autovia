import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import { buildEleveQuotaSnapshot } from "@/lib/eleve-quota"
import {
  canResumePaid,
  canResumeTrial,
  getPaidDaysLeft,
  getTrialDaysLeft,
} from "@/lib/api/site-admin-access-update"
import { subscriptionPlanLabel } from "@/lib/subscription-plans"
import {
  isVerificationDocumentsEnabled,
  verificationStatusLabel,
} from "@/lib/verification/constants"
import type { SubscriptionPlan, SubscriptionStatus, VerificationStatus } from "@prisma/client"

export type SiteAdminQuotaDto = {
  maxEleves: number | null
  currentEleves: number
  remaining: number | null
  formulaQuota: number
  isTrial: boolean
  isUnlimited: boolean
  usagePercent: number | null
}

export type SiteAdminAutoEcoleDto = {
  id: string
  nom: string
  slug: string
  ville: string | null
  telephone: string | null
  emailContact: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan | null
  subscriptionPlanLabel: string
  maxElevesOverride: number | null
  quota: SiteAdminQuotaDto
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
  verificationStatus: VerificationStatus
  verificationStatusLabel: string
  verificationRejectionReason: string | null
  verificationReviewedAt: string | null
  verificationDocumentsPurgedAt: string | null
  verificationDocumentCount: number
}

export type SiteAdminDashboardStats = {
  total: number
  active: number
  blocked: number
  trial: number
  expired: number
  cancelled: number
  pendingVerification: number
  newLast7Days: number
  newLast30Days: number
}

type AutoEcoleForAdminDto = {
  id: string
  nom: string
  slug: string
  ville: string | null
  telephone: string | null
  emailContact: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan | null
  maxElevesOverride: number | null
  trialEndsAt: Date
  paidUntil: Date | null
  adminNotes: string | null
  verificationStatus: VerificationStatus
  verificationRejectionReason: string | null
  verificationReviewedAt: Date | null
  verificationDocumentsPurgedAt: Date | null
  createdAt: Date
  updatedAt: Date
  users: Array<{ prenom: string; nom: string; email: string }>
  categoriesPermis?: Array<{ code: string }>
  _count?: {
    eleves: number
    users: number
    moniteurs: number
    vehicules: number
    listesExamen: number
    verificationDocuments?: number
  }
}

export const siteAdminAutoEcoleInclude = {
  users: { where: { role: "OWNER" as const }, take: 1 },
  categoriesPermis: { where: { actif: true }, select: { code: true } },
  _count: {
    select: {
      eleves: true,
      users: true,
      moniteurs: true,
      vehicules: true,
      listesExamen: true,
      verificationDocuments: true,
    },
  },
} as const

export function toSiteAdminAutoEcoleDto(
  ae: AutoEcoleForAdminDto,
  now: Date = new Date(),
): SiteAdminAutoEcoleDto {
  const owner = ae.users[0] ?? null
  const accessInput = {
    subscriptionStatus: ae.subscriptionStatus,
    trialEndsAt: ae.trialEndsAt,
    paidUntil: ae.paidUntil,
    verificationStatus: ae.verificationStatus,
  }
  const trialLeft = getTrialDaysLeft(ae.trialEndsAt, now)
  const paidLeft = getPaidDaysLeft(ae.paidUntil, now)
  const currentEleves = ae._count?.eleves ?? 0

  const snapshot = buildEleveQuotaSnapshot({
    subscriptionStatus: ae.subscriptionStatus,
    subscriptionPlan: ae.subscriptionPlan,
    maxElevesOverride: ae.maxElevesOverride,
    activeCategoryCodes: ae.categoriesPermis?.map((c) => c.code) ?? [],
    currentEleveCount: currentEleves,
  })

  const usagePercent =
    snapshot.maxEleves != null && snapshot.maxEleves > 0
      ? Math.min(100, Math.round((currentEleves / snapshot.maxEleves) * 100))
      : null

  return {
    id: ae.id,
    nom: ae.nom,
    slug: ae.slug,
    ville: ae.ville,
    telephone: ae.telephone,
    emailContact: ae.emailContact,
    subscriptionStatus: ae.subscriptionStatus,
    subscriptionPlan: ae.subscriptionPlan,
    subscriptionPlanLabel: subscriptionPlanLabel(ae.subscriptionPlan),
    maxElevesOverride: ae.maxElevesOverride,
    quota: {
      maxEleves: snapshot.maxEleves,
      currentEleves: snapshot.currentEleves,
      remaining: snapshot.remaining,
      formulaQuota: snapshot.formulaQuota,
      isTrial: snapshot.isTrial,
      isUnlimited: snapshot.isUnlimited,
      usagePercent,
    },
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
      eleves: currentEleves,
      users: ae._count?.users ?? 0,
      moniteurs: ae._count?.moniteurs ?? 0,
      vehicules: ae._count?.vehicules ?? 0,
      listesExamen: ae._count?.listesExamen ?? 0,
    },
    trialDaysLeft: trialLeft > 0 ? trialLeft : null,
    paidDaysLeft: paidLeft,
    canResumeTrial: canResumeTrial(ae, now),
    canResumePaid: canResumePaid(ae, now),
    verificationStatus: isVerificationDocumentsEnabled() ? ae.verificationStatus : "APPROVED",
    verificationStatusLabel: isVerificationDocumentsEnabled()
      ? verificationStatusLabel(ae.verificationStatus)
      : "Validé",
    verificationRejectionReason: ae.verificationRejectionReason,
    verificationReviewedAt: ae.verificationReviewedAt?.toISOString() ?? null,
    verificationDocumentsPurgedAt: ae.verificationDocumentsPurgedAt?.toISOString() ?? null,
    verificationDocumentCount: ae._count?.verificationDocuments ?? 0,
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
    pendingVerification: isVerificationDocumentsEnabled()
      ? rows.filter(
          (r) =>
            r.verificationStatus === "PENDING_REVIEW" ||
            r.verificationStatus === "PENDING_DOCUMENTS",
        ).length
      : 0,
    newLast7Days: rows.filter((r) => new Date(r.createdAt) >= day7).length,
    newLast30Days: rows.filter((r) => new Date(r.createdAt) >= day30).length,
  }
}
