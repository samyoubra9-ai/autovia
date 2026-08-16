import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { findNextFreeSlots } from "@/lib/api/seances"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { searchParams } = new URL(request.url)
    const aroundRaw = searchParams.get("around") ?? searchParams.get("dateHeure")
    const excludeId = searchParams.get("excludeId") ?? undefined

    if (!aroundRaw) throw new ApiError(400, "Paramètre around ou dateHeure requis.")

    const around = new Date(aroundRaw)
    if (Number.isNaN(around.getTime())) throw new ApiError(400, "Date invalide.")

    const suggestions = await findNextFreeSlots(
      tenant.autoEcoleId,
      around,
      3,
      excludeId,
    )

    return jsonWithCors({ suggestions }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
