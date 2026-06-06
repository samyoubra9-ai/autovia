import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { formatDateListe } from "@/lib/api/liste-examen"
import {
  dateDernierExamenKey,
  lookupDatesDernierExamen,
} from "@/lib/api/liste-examen-date-dernier"
import { prisma } from "@/lib/prisma"
import type { NatureExamenListe } from "@prisma/client"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

function parseDateExamen(value: unknown): Date {
  const s = String(value ?? "").trim()
  if (!s) throw new ApiError(400, "Date d'examen requise.")
  const d = new Date(s.includes("T") ? s : `${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Date d'examen invalide.")
  return d
}

function parseCandidats(raw: unknown): { eleveId: string; natureExamen: NatureExamenListe }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ApiError(400, "Liste de candidats requise.")
  }
  return raw.map((item) => {
    const o = item as Record<string, unknown>
    const nature = String(o.natureExamen ?? "") as NatureExamenListe
    if (!["code", "creneau", "circulation"].includes(nature)) {
      throw new ApiError(400, "Nature d'examen invalide.")
    }
    const eleveId = String(o.eleveId ?? "").trim()
    if (!eleveId) throw new ApiError(400, "Identifiant candidat manquant.")
    return { eleveId, natureExamen: nature }
  })
}

/** Prévisualisation des dates « dernier examen » avant enregistrement de la liste. */
export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = (await request.json()) as Record<string, unknown>
    const dateExamen = parseDateExamen(body.dateExamen)
    const candidats = parseCandidats(body.candidats)

    const lookup = await lookupDatesDernierExamen(
      prisma,
      tenant.autoEcoleId,
      dateExamen,
      candidats,
    )

    const dates: Record<string, string | null> = {}
    for (const c of candidats) {
      const key = dateDernierExamenKey(c.eleveId, c.natureExamen)
      const d = lookup.get(key)
      dates[key] = d ? formatDateListe(d) : null
    }

    return jsonWithCors({ dates }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
