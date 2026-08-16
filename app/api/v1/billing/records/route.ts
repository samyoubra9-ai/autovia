import { requireTenant } from "@/lib/api/auth"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { toBillingRecordDto } from "@/lib/api/subscription-billing"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)

    const rows = await prisma.subscriptionBillingRecord.findMany({
      where: { autoEcoleId: tenant.autoEcoleId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return jsonWithCors(
      {
        records: rows.map(toBillingRecordDto),
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
