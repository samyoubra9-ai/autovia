import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { requireTenant } from "@/lib/api/auth"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { toEleveDto } from "@/lib/api/mappers"
import {
  refuseEleveInscription,
  validateEleveInscription,
} from "@/lib/api/public-inscription"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

const eleveInclude = {
  categoriePermis: true,
  moniteur: true,
  vehicule: true,
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {}

    if (raw.action === "refuse") {
      await refuseEleveInscription(
        tenant.autoEcoleId,
        id,
        raw.reason != null ? String(raw.reason) : null,
      )
      return jsonWithCors({ ok: true, action: "refuse" }, origin)
    }

    const updated = await validateEleveInscription(tenant.autoEcoleId, id, {
      moniteurId: raw.moniteurId != null ? String(raw.moniteurId) : null,
      vehiculeId: raw.vehiculeId != null ? String(raw.vehiculeId) : null,
    })

    const full = await prisma.eleve.findUnique({
      where: { id: updated.id },
      include: eleveInclude,
    })
    const eleve = full ? toEleveDto(full) : null
    if (!eleve) throw new ApiError(500, "Erreur lors de la validation.")

    return jsonWithCors({ ok: true, action: "validate", eleve }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
