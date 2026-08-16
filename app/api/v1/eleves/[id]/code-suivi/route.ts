import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  ensureEleveCodeSuivi,
  formatCodeSuiviDisplay,
  getSuiviPublicUrl,
} from "@/lib/api/code-suivi"
import { toEleveDto } from "@/lib/api/mappers"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

/** Génère ou retourne le code de suivi + URL pour carte / QR */
export async function POST(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.eleve.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Élève introuvable.")

    const codeSuivi = await ensureEleveCodeSuivi(id)
    const eleve = await prisma.eleve.findUniqueOrThrow({
      where: { id },
      include: { categoriePermis: true },
    })

    const dto = toEleveDto(eleve)
    if (!dto) throw new ApiError(500, "Données élève invalides.")

    return jsonWithCors(
      {
        codeSuivi,
        codeSuiviDisplay: formatCodeSuiviDisplay(codeSuivi),
        suiviUrl: getSuiviPublicUrl(codeSuivi),
        eleve: dto,
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
