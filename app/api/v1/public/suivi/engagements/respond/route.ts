import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { respondCandidatEngagement } from "@/lib/api/candidat-engagement"
import { resolveEleveIdBySuiviCode } from "@/lib/push/resolve-eleve"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const body = (await request.json()) as Record<string, unknown>
    const code = String(body.code ?? "").trim()
    const engagementId = String(body.engagementId ?? "").trim() || undefined
    const referenceId = String(body.referenceId ?? "").trim() || undefined
    const typeRaw = String(body.type ?? "").trim().toLowerCase()
    const type =
      typeRaw === "seance" || typeRaw === "examen" ? typeRaw : undefined
    const statutRaw = String(body.statut ?? "").trim().toLowerCase()

    if (statutRaw !== "accepte" && statutRaw !== "refuse") {
      throw new ApiError(400, "Réponse invalide (accepte ou refuse).")
    }

    const eleveId = await resolveEleveIdBySuiviCode(code)
    const engagement = await respondCandidatEngagement({
      eleveId,
      engagementId,
      type,
      referenceId,
      statut: statutRaw,
      motif: body.motif != null ? String(body.motif) : null,
    })

    return jsonWithCors({ ok: true, engagement }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
