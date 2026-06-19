import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { listPublicAutoEcoles } from "@/lib/api/public-auto-ecoles"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const autoEcoles = await listPublicAutoEcoles()
    return jsonWithCors({ autoEcoles }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
