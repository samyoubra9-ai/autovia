import { Prisma } from "@prisma/client"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import {
  addCandidatsToListeExamen,
  parseAddCandidatsInput,
} from "@/lib/api/liste-examen-add-candidats"
import { toListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>

    let inputs
    try {
      inputs = parseAddCandidatsInput(body.candidats)
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Données invalides.")
    }

    const refreshed = await addCandidatsToListeExamen(tenant.autoEcoleId, id, inputs)
    const categories = await ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId)

    return jsonWithCors({ liste: toListeExamenDto(refreshed, categories) }, origin)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return handleApiError(
          new ApiError(409, "Conflit : un candidat ou un ordre est déjà utilisé sur cette liste."),
          origin,
        )
      }
    }
    return handleApiError(error, origin)
  }
}
