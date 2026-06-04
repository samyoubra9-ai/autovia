import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { parseOptionalRelationId } from "@/lib/api/optional-id"
import { parseSeanceType } from "@/lib/api/seance-type"
import {
  ensureEngagementsForTenant,
  loadEngagementsForSeanceIds,
  syncSeanceEngagement,
} from "@/lib/api/candidat-engagement"
import { toSeanceExamenDto } from "@/lib/api/mappers-seance"
import { safeMapSync } from "@/lib/api/safe"
import {
  assertSeanceHorizonLibre,
  assertVehiculeLibre,
  createSeanceForTenant,
  listSeancesForTenant,
} from "@/lib/api/seances"
import { notifyBackdashSeanceCreated } from "@/lib/push/backdash-events"
import { notifyCandidatSeanceCreated } from "@/lib/push/candidat-events"
import { prisma } from "@/lib/prisma"
import type { SeanceStatut } from "@prisma/client"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const dateFilter =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        : undefined

    await ensureEngagementsForTenant(tenant.autoEcoleId)
    const seances = await listSeancesForTenant(tenant.autoEcoleId, dateFilter)
    const engagementMap = await loadEngagementsForSeanceIds(seances.map((s) => s.id))
    return jsonWithCors(
      {
        seances: safeMapSync(
          seances,
          (s) => toSeanceExamenDto(s, engagementMap.get(s.id) ?? null),
          "seance",
        ),
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = await request.json()
    const eleveId = String(body.eleveId ?? "").trim()
    const dateHeureRaw = body.dateHeure
    const moniteurId = parseOptionalRelationId(body.moniteurId)
    const vehiculeId = parseOptionalRelationId(body.vehiculeId)
    const statut = (body.statut as SeanceStatut) ?? "planifie"
    const type = parseSeanceType(body.type)

    if (!eleveId || !dateHeureRaw) {
      throw new ApiError(400, "Élève et date/heure requis.")
    }

    const dateHeure = new Date(String(dateHeureRaw))
    if (Number.isNaN(dateHeure.getTime())) {
      throw new ApiError(400, "Date ou heure invalide.")
    }

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, autoEcoleId: tenant.autoEcoleId },
    })
    if (!eleve) throw new ApiError(404, "Élève introuvable.")

    if (moniteurId) {
      const m = await prisma.moniteur.findFirst({
        where: { id: moniteurId, autoEcoleId: tenant.autoEcoleId, actif: true },
      })
      if (!m) throw new ApiError(404, "Moniteur introuvable.")
    }

    if (vehiculeId) {
      const v = await prisma.vehicule.findFirst({
        where: { id: vehiculeId, autoEcoleId: tenant.autoEcoleId },
      })
      if (!v) throw new ApiError(404, "Véhicule introuvable.")
    }

    await assertSeanceHorizonLibre(tenant.autoEcoleId, dateHeure)
    if (vehiculeId) await assertVehiculeLibre(tenant.autoEcoleId, vehiculeId, dateHeure)

    const trimMsg = (v: unknown) => {
      if (v == null) return null
      const s = String(v).trim()
      return s.length ? s : null
    }

    const seance = await createSeanceForTenant({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      type,
      moniteurId,
      vehiculeId,
      dateHeure,
      statut,
      notes: body.notes !== undefined ? trimMsg(body.notes) : null,
      messageCandidat: trimMsg(body.messageCandidat),
    })

    await syncSeanceEngagement({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      seanceId: seance.id,
      statut,
      dateHeure,
    })

    const dto = toSeanceExamenDto(
      seance,
      (
        await loadEngagementsForSeanceIds([seance.id])
      ).get(seance.id) ?? null,
    )
    if (!dto) throw new ApiError(500, "Erreur lors de la création de la séance.")

    notifyCandidatSeanceCreated({
      eleveId,
      type,
      dateHeure,
      statut,
      messageCandidat: trimMsg(body.messageCandidat),
    })
    notifyBackdashSeanceCreated({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      type,
      dateHeure,
      statut,
    })

    return jsonWithCors({ seance: dto }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
