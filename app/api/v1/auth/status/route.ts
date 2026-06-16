import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import { loadEleveQuotaSnapshot } from "@/lib/api/eleve-quota-context"
import { loadTrialPlanSnapshot } from "@/lib/api/trial-plan-context"
import { requireAuthUser } from "@/lib/api/auth"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"
import { subscriptionPlanLabel } from "@/lib/subscription-plans"
import { loadVerificationSnapshot } from "@/lib/verification/documents"
import { verificationStatusLabel } from "@/lib/verification/constants"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const authUser = await requireAuthUser(request)

    const siteAdmin = await prisma.siteAdmin.findUnique({
      where: { supabaseUserId: authUser.id },
    })
    if (siteAdmin) {
      return jsonWithCors(
        {
          role: "site_admin" as const,
          email: authUser.email,
          hasTenant: false,
          hasAccess: true,
        },
        origin,
      )
    }

    const tenant = await prisma.user.findUnique({
      where: { supabaseUserId: authUser.id },
      include: { autoEcole: true },
    })

    if (!tenant) {
      return jsonWithCors(
        {
          role: "pending_onboarding" as const,
          email: authUser.email,
          hasTenant: false,
          hasAccess: false,
        },
        origin,
      )
    }

    const ae = tenant.autoEcole
    const hasAccess = hasAutoEcoleAccess(ae)
    const [quota, trialLimits, verificationRaw] = await Promise.all([
      loadEleveQuotaSnapshot(prisma, ae.id),
      loadTrialPlanSnapshot(prisma, ae.id, ae.subscriptionStatus),
      loadVerificationSnapshot(prisma, ae.id),
    ])
    const { autoEcoleNom: _n, ...verification } = verificationRaw

    return jsonWithCors(
      {
        role: "auto_ecole" as const,
        email: authUser.email,
        hasTenant: true,
        hasAccess,
        user: {
          id: tenant.id,
          prenom: tenant.prenom,
          nom: tenant.nom,
          email: tenant.email,
        },
        autoEcole: {
          id: ae.id,
          nom: ae.nom,
          slug: ae.slug,
          subscriptionStatus: ae.subscriptionStatus,
          subscriptionPlan: ae.subscriptionPlan,
          subscriptionPlanLabel: subscriptionPlanLabel(ae.subscriptionPlan),
          trialEndsAt: ae.trialEndsAt.toISOString(),
          paidUntil: ae.paidUntil?.toISOString() ?? null,
          accessDetail: getAccessDetail(ae),
        },
        plan: {
          isTrial: quota.isTrial,
          isUnlimited: quota.isUnlimited,
          maxEleves: quota.maxEleves,
          currentEleves: quota.currentEleves,
          remaining: quota.remaining,
          formulaQuota: quota.formulaQuota,
          subscriptionPlan: quota.subscriptionPlan,
          subscriptionPlanLabel: subscriptionPlanLabel(quota.subscriptionPlan),
          trialLimits,
          verification: {
            ...verification,
            statusLabel: verificationStatusLabel(verification.status),
          },
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
