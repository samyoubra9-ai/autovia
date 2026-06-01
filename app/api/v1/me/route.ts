import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    return jsonWithCors(
      {
        user: {
          id: tenant.userId,
          email: tenant.email,
          prenom: tenant.prenom,
          nom: tenant.nom,
        },
        autoEcole: {
          ...tenant.autoEcole,
          trialEndsAt: tenant.autoEcole.trialEndsAt.toISOString(),
          paidUntil: tenant.autoEcole.paidUntil?.toISOString() ?? null,
          telephone: tenant.autoEcole.telephone ?? null,
          ville: tenant.autoEcole.ville ?? null,
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
