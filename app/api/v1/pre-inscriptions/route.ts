import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { requireTenant } from "@/lib/api/auth"
import { handleApiError } from "@/lib/api/errors"
import { safeMapSync } from "@/lib/api/safe"
import { toPreInscriptionDto } from "@/lib/api/pre-inscription-mapper"
import { assertOnlineInscriptionForAutoEcole } from "@/lib/plan-features"
import { prisma } from "@/lib/prisma"

const include = {
  categoriePermis: true,
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    await assertOnlineInscriptionForAutoEcole(prisma, tenant.autoEcoleId)
    const rows = await prisma.eleve.findMany({
      where: {
        autoEcoleId: tenant.autoEcoleId,
        statutInscription: "EN_ATTENTE",
      },
      orderBy: { createdAt: "desc" },
      include,
    })
    return jsonWithCors(
      {
        preInscriptions: safeMapSync(rows, (r) => toPreInscriptionDto(r), "preInscription"),
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
