import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import { removeCandidatFromListeExamen } from "@/lib/api/liste-examen-add-candidats"
import { toListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string; candidatId: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id, candidatId } = await params

    const refreshed = await removeCandidatFromListeExamen(
      tenant.autoEcoleId,
      id,
      candidatId,
    )
    const categories = await ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId)

    return jsonWithCors({ liste: toListeExamenDto(refreshed, categories) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
