import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { parseOptionalRelationId } from "@/lib/api/optional-id"
import { parseSeanceType } from "@/lib/api/seance-type"
import {
  deleteSeanceEngagement,
  loadEngagementsForSeanceIds,
  syncSeanceEngagement,
} from "@/lib/api/candidat-engagement"
import { toSeanceExamenDto } from "@/lib/api/mappers-seance"
import {
  assertSeanceHorizonLibre,
  assertVehiculeLibre,
  updateSeanceForTenant,
} from "@/lib/api/seances"
import {
  notifyCandidatSeanceDeleted,
  notifyCandidatSeanceUpdated,
} from "@/lib/push/candidat-events"
import {
  notifyBackdashSeanceDeleted,
  notifyBackdashSeanceUpdated,
} from "@/lib/push/backdash-events"
import { prisma } from "@/lib/prisma"
import type { SeanceStatut } from "@prisma/client"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.seanceExamen.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Séance introuvable.")

    const body = await request.json()
    let eleveId = existing.eleveId
    let dateHeure = existing.dateHeure
    let moniteurId = existing.moniteurId
    let vehiculeId = existing.vehiculeId
    let statut = existing.statut
    let type = existing.type

    if (body.eleveId !== undefined) {
      eleveId = String(body.eleveId).trim()
      const eleve = await prisma.eleve.findFirst({
        where: { id: eleveId, autoEcoleId: tenant.autoEcoleId },
      })
      if (!eleve) throw new ApiError(404, "Élève introuvable.")
    }

    if (body.type !== undefined) {
      type = parseSeanceType(body.type)
    }

    if (body.dateHeure !== undefined) {
      dateHeure = new Date(String(body.dateHeure))
      if (Number.isNaN(dateHeure.getTime())) {
        throw new ApiError(400, "Date ou heure invalide.")
      }
    }

    if (body.moniteurId !== undefined) {
      moniteurId = parseOptionalRelationId(body.moniteurId)
      if (moniteurId) {
        const m = await prisma.moniteur.findFirst({
          where: { id: moniteurId, autoEcoleId: tenant.autoEcoleId, actif: true },
        })
        if (!m) throw new ApiError(404, "Moniteur introuvable.")
      }
    }

    if (body.vehiculeId !== undefined) {
      vehiculeId = parseOptionalRelationId(body.vehiculeId)
      if (vehiculeId) {
        const v = await prisma.vehicule.findFirst({
          where: { id: vehiculeId, autoEcoleId: tenant.autoEcoleId },
        })
        if (!v) throw new ApiError(404, "Véhicule introuvable.")
      }
    }

    if (body.statut !== undefined) {
      statut = body.statut as SeanceStatut
    }

    await assertSeanceHorizonLibre(tenant.autoEcoleId, dateHeure, {
      excludeId: id,
      type,
      eleveId,
    })
    if (vehiculeId) await assertVehiculeLibre(tenant.autoEcoleId, vehiculeId, dateHeure, id)

    const trimOptional = (v: unknown) => {
      if (v == null) return null
      const s = String(v).trim()
      return s.length ? s : null
    }

    const dateChanged =
      body.dateHeure !== undefined &&
      new Date(String(body.dateHeure)).getTime() !== existing.dateHeure.getTime()
    const statutChanged = body.statut !== undefined && body.statut !== existing.statut
    const messageChanged =
      body.messageCandidat !== undefined &&
      trimOptional(body.messageCandidat) !== existing.messageCandidat

    const seance = await updateSeanceForTenant(id, {
      eleveId,
      type,
      dateHeure,
      moniteurId,
      vehiculeId,
      statut,
      notes:
        body.notes !== undefined ? trimOptional(body.notes) : existing.notes,
      messageCandidat:
        body.messageCandidat !== undefined
          ? trimOptional(body.messageCandidat)
          : existing.messageCandidat,
    })

    await syncSeanceEngagement({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      seanceId: id,
      statut,
      dateHeure,
      resetResponse: dateChanged || statutChanged || messageChanged,
    })

    const dto = toSeanceExamenDto(
      seance,
      (
        await loadEngagementsForSeanceIds([id])
      ).get(id) ?? null,
    )
    if (!dto) throw new ApiError(500, "Erreur lors de la mise à jour de la séance.")

    notifyCandidatSeanceUpdated({
      eleveId,
      type,
      dateHeure,
      statut,
      previousStatut: existing.statut,
      previousDateHeure: existing.dateHeure,
      messageCandidat:
        body.messageCandidat !== undefined
          ? trimOptional(body.messageCandidat)
          : existing.messageCandidat,
    })
    notifyBackdashSeanceUpdated({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      type,
      dateHeure,
      statut,
      previousStatut: existing.statut,
      previousDateHeure: existing.dateHeure,
    })

    return jsonWithCors({ seance: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.seanceExamen.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Séance introuvable.")

    await prisma.seanceExamen.delete({ where: { id } })
    await deleteSeanceEngagement(id)

    notifyCandidatSeanceDeleted({
      eleveId: existing.eleveId,
      type: existing.type,
      dateHeure: existing.dateHeure,
    })
    notifyBackdashSeanceDeleted({
      autoEcoleId: tenant.autoEcoleId,
      eleveId: existing.eleveId,
      type: existing.type,
      dateHeure: existing.dateHeure,
    })

    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
