import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { getEleveDossierExpirationSummary } from "@/lib/api/eleve-dossier-expiration"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const eleves = await getEleveDossierExpirationSummary(tenant.autoEcoleId)
    return jsonWithCors({ eleves }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
