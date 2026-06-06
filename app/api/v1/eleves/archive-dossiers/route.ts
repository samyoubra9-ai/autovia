import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { loadArchiveDossiersForEleves } from "@/lib/api/eleve-archive-dossier"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

function parseEleveIds(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Sélectionnez au moins un candidat.")
  }
  const ids = raw.map((id) => String(id ?? "").trim()).filter(Boolean)
  if (ids.length === 0) throw new ApiError(400, "Identifiants candidats invalides.")
  if (ids.length > 50) {
    throw new ApiError(400, "Maximum 50 dossiers par impression d'archive.")
  }
  return ids
}

/** Dossiers d'archive complets (parcours, examens officiels, finance). */
export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = (await request.json()) as Record<string, unknown>
    const eleveIds = parseEleveIds(body.eleveIds)

    const autoEcole = await prisma.autoEcole.findUnique({
      where: { id: tenant.autoEcoleId },
      select: { nom: true },
    })
    if (!autoEcole) throw new ApiError(404, "Auto-école introuvable.")

    let dossiers
    try {
      dossiers = await loadArchiveDossiersForEleves(
        prisma,
        tenant.autoEcoleId,
        eleveIds,
        autoEcole.nom,
      )
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Candidats introuvables.")
    }

    return jsonWithCors({ dossiers }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
