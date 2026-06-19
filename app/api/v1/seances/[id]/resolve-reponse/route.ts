import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  loadEngagementsForSeanceIds,
  resolveSeanceEngagementByStaff,
} from "@/lib/api/candidat-engagement"
import { toSeanceExamenDto } from "@/lib/api/mappers-seance"
import { seanceInclude } from "@/lib/api/seances"
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
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const outcomeRaw = String(body.outcome ?? "").trim().toLowerCase()
    if (outcomeRaw !== "present" && outcomeRaw !== "absent") {
      throw new ApiError(400, "Réponse invalide : présent ou absent attendu.")
    }

    await resolveSeanceEngagementByStaff({
      autoEcoleId: tenant.autoEcoleId,
      seanceId: id,
      outcome: outcomeRaw,
    })

    const seance = await prisma.seanceExamen.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
      include: seanceInclude,
    })
    if (!seance) throw new ApiError(404, "Séance introuvable.")

    const engagementMap = await loadEngagementsForSeanceIds([id])
    const dto = toSeanceExamenDto(seance, engagementMap.get(id) ?? null)
    if (!dto) throw new ApiError(500, "Erreur lors de la mise à jour.")

    return jsonWithCors({ ok: true, seance: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
