import { getAccessDetail, hasAutoEcoleAccess } from "@/lib/access"
import { requireAuthUser } from "@/lib/api/auth"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"

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
          trialEndsAt: ae.trialEndsAt.toISOString(),
          paidUntil: ae.paidUntil?.toISOString() ?? null,
          accessDetail: getAccessDetail(ae),
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
