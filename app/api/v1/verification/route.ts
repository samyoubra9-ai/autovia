import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenantMembership } from "@/lib/api/auth"
import { prisma } from "@/lib/prisma"
import { loadVerificationSnapshot } from "@/lib/verification/documents"
import { verificationStatusLabel } from "@/lib/verification/constants"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenantMembership(request)
    const verification = await loadVerificationSnapshot(prisma, tenant.autoEcoleId)

    return jsonWithCors(
      {
        verification: {
          ...verification,
          statusLabel: verificationStatusLabel(verification.status),
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
