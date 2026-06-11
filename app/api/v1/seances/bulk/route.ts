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
  createSeancesBulkForTenant,
  scheduleSeancesForCandidates,
  SEANCE_MIN_GAP_MINUTES,
} from "@/lib/api/seances"
import { notifyBackdashSeanceCreated } from "@/lib/push/backdash-events"
import { notifyCandidatSeanceCreated } from "@/lib/push/candidat-events"
import { prisma } from "@/lib/prisma"
import type { SeanceStatut } from "@prisma/client"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

function trimMsg(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length ? s : null
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = await request.json()
    const rawIds = body.eleveIds
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      throw new ApiError(400, "Sélectionnez au moins un candidat.")
    }
    const eleveIds = [...new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))]
    if (eleveIds.length === 0) {
      throw new ApiError(400, "Sélectionnez au moins un candidat.")
    }

    const dateHeureRaw = body.dateHeure
    if (!dateHeureRaw) throw new ApiError(400, "Date et heure requises.")
    const startDateHeure = new Date(String(dateHeureRaw))
    if (Number.isNaN(startDateHeure.getTime())) {
      throw new ApiError(400, "Date ou heure invalide.")
    }

    const type = parseSeanceType(body.type)
    const moniteurId = parseOptionalRelationId(body.moniteurId)
    const vehiculeId = parseOptionalRelationId(body.vehiculeId)
    const statut = (body.statut as SeanceStatut) ?? "planifie"

    const eleves = await prisma.eleve.findMany({
      where: { autoEcoleId: tenant.autoEcoleId, id: { in: eleveIds } },
      select: { id: true, prenom: true, nom: true, statutFormation: true },
    })
    if (eleves.length !== eleveIds.length) {
      throw new ApiError(400, "Un ou plusieurs candidats sont introuvables.")
    }

    const wrongStage = eleves.filter((e) => e.statutFormation !== type)
    if (wrongStage.length > 0) {
      const label = wrongStage.map((e) => `${e.prenom} ${e.nom}`).join(", ")
      throw new ApiError(
        400,
        `Ces candidats ne sont pas à l'étape « ${type} » : ${label}.`,
      )
    }

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

    const slots = scheduleSeancesForCandidates(type, startDateHeure, eleveIds.length)
    const lastSlot = slots[slots.length - 1]
    if (lastSlot) {
      const endHour = lastSlot.getHours() + (lastSlot.getMinutes() > 0 ? 1 : 0)
      if (lastSlot.getHours() >= 19 || endHour > 19) {
        throw new ApiError(
          400,
          `La planification dépasse 19h (dernier créneau : ${lastSlot.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}). Réduisez le nombre de candidats ou avancez l'heure de début.`,
        )
      }
    }

    await ensureEngagementsForTenant(tenant.autoEcoleId)

    const notes = body.notes !== undefined ? trimMsg(body.notes) : null
    const messageCandidat = trimMsg(body.messageCandidat)

    const created = await createSeancesBulkForTenant({
      autoEcoleId: tenant.autoEcoleId,
      eleveIds,
      type,
      startDateHeure,
      notes,
      messageCandidat,
      moniteurId,
      vehiculeId,
      statut,
    })

    const engagementMap = await loadEngagementsForSeanceIds(created.map((s) => s.id))

    const seances = safeMapSync(
      created,
      (s) => toSeanceExamenDto(s, engagementMap.get(s.id) ?? null),
      "seance",
    )

    for (const seance of created) {
      await syncSeanceEngagement({
        autoEcoleId: tenant.autoEcoleId,
        eleveId: seance.eleveId,
        seanceId: seance.id,
        statut,
        dateHeure: seance.dateHeure,
      })
      notifyCandidatSeanceCreated({
        eleveId: seance.eleveId,
        type,
        dateHeure: seance.dateHeure,
        statut,
        messageCandidat,
      })
      notifyBackdashSeanceCreated({
        autoEcoleId: tenant.autoEcoleId,
        eleveId: seance.eleveId,
        type,
        dateHeure: seance.dateHeure,
        statut,
      })
    }

    return jsonWithCors(
      {
        seances,
        schedule: {
          type,
          gapMinutes: type === "code" ? 0 : SEANCE_MIN_GAP_MINUTES,
          slots: slots.map((d) => d.toISOString()),
        },
      },
      origin,
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
