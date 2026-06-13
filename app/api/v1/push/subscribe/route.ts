import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    throw new ApiError(
      410,
      "Les notifications push backdash sont désactivées. Utilisez la cloche in-app.",
      "BACKDASH_PUSH_DISABLED",
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
