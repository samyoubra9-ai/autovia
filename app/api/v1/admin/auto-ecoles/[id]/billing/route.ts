import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import { toBillingRecordDto } from "@/lib/api/subscription-billing"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)
    const { id } = await params

    const autoEcole = await prisma.autoEcole.findUnique({ where: { id }, select: { id: true } })
    if (!autoEcole) throw new ApiError(404, "Auto-école introuvable.")

    const rows = await prisma.subscriptionBillingRecord.findMany({
      where: { autoEcoleId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return jsonWithCors({ records: rows.map(toBillingRecordDto) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
