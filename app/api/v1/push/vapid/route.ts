import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    return jsonWithCors({ enabled: false, publicKey: null }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
