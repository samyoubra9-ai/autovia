import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { removeElevePhotoFromStorage } from "@/lib/api/eleve-photo"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

function parseEleveIds(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Sélectionnez au moins un candidat.")
  }
  const ids = [...new Set(raw.map((id) => String(id ?? "").trim()).filter(Boolean))]
  if (ids.length === 0) throw new ApiError(400, "Identifiants candidats invalides.")
  if (ids.length > 50) {
    throw new ApiError(400, "Maximum 50 suppressions à la fois.")
  }
  return ids
}

/** Suppression groupée après archivage / impression du dossier. */
export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = (await request.json()) as Record<string, unknown>
    const eleveIds = parseEleveIds(body.eleveIds)

    const existing = await prisma.eleve.findMany({
      where: { autoEcoleId: tenant.autoEcoleId, id: { in: eleveIds } },
      select: { id: true, photoPath: true },
    })
    if (existing.length !== eleveIds.length) {
      throw new ApiError(400, "Un ou plusieurs candidats sont introuvables.")
    }

    for (const row of existing) {
      if (row.photoPath) {
        await removeElevePhotoFromStorage(row.photoPath).catch(() => undefined)
      }
    }

    await prisma.eleve.deleteMany({
      where: { autoEcoleId: tenant.autoEcoleId, id: { in: eleveIds } },
    })

    return jsonWithCors({ ok: true, deleted: eleveIds.length }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
