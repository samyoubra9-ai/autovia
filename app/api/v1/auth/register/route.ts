import { requireAuthUser } from "@/lib/api/auth"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import {
  parseOnboardingRegisterInput,
  registerAutoEcoleTenant,
} from "@/lib/api/onboarding-register"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const authUser = await requireAuthUser(request)
    const body = await request.json()
    const input = parseOnboardingRegisterInput(body)
    const result = await registerAutoEcoleTenant(authUser.id, authUser.email, input)
    return jsonWithCors(result, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
