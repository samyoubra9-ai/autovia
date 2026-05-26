import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { getSuiviPublicByCode } from "@/lib/api/suivi-public"

type Params = { params: Promise<{ code: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const { code } = await params
    const suivi = await getSuiviPublicByCode(code)
    return jsonWithCors({ suivi }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
