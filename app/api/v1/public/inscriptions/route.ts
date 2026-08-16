import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { createPublicPreInscription } from "@/lib/api/public-inscription"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const body = await request.json()
    const result = await createPublicPreInscription(body)
    return jsonWithCors({ ok: true, inscription: result }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
