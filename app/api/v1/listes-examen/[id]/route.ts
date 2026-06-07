import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import {
  candidatDataOnResultat,
  eleveUpdateOnAdmis,
  parseCandidatsResultats,
} from "@/lib/api/liste-examen-resultats"
import { sameCalendarDayUtc } from "@/lib/api/liste-examen"
import {
  hasListeExamenHeaderPatch,
  parseListeExamenHeaderPatch,
} from "@/lib/api/liste-examen-header"
import {
  fillMissingDatesDernierExamenOnListe,
  refreshDatesDernierExamenOnListe,
} from "@/lib/api/liste-examen-date-dernier"
import { toListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { prisma, PRISMA_TRANSACTION_OPTS } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

const candidatInclude = {
  eleve: { include: { categoriePermis: true } },
  categoriePermis: true,
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const [liste, categories] = await Promise.all([
      prisma.listeExamen.findFirst({
        where: { id, autoEcoleId: tenant.autoEcoleId },
        include: {
          candidats: { include: candidatInclude },
          messagesCategorie: { include: { categoriePermis: true } },
        },
      }),
      ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId),
    ])
    if (!liste) throw new ApiError(404, "Liste introuvable.")
    await fillMissingDatesDernierExamenOnListe(liste)
    let dto
    try {
      dto = toListeExamenDto(liste, categories)
    } catch (mapErr) {
      console.error("[api] toListeExamenDto GET", mapErr)
      throw new ApiError(500, "Erreur lors de la lecture de la liste.")
    }
    return jsonWithCors({ liste: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const body = (await request.json()) as Record<string, unknown>

    const headerPatch = hasListeExamenHeaderPatch(body)
      ? parseListeExamenHeaderPatch(body)
      : null
    const hasCandidats = body.candidats !== undefined

    if (!headerPatch && !hasCandidats) {
      throw new ApiError(400, "Aucune modification.")
    }

    const liste = await prisma.listeExamen.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
      include: { candidats: { include: candidatInclude } },
    })
    if (!liste) throw new ApiError(404, "Liste introuvable.")

    const byId = new Map(liste.candidats.map((c) => [c.id, c]))
    const dateExamenChanged =
      headerPatch?.dateExamen !== undefined &&
      !sameCalendarDayUtc(headerPatch.dateExamen, liste.dateExamen)

    await prisma.$transaction(
      async (tx) => {
        if (headerPatch) {
          await tx.listeExamen.update({
            where: { id: liste.id },
            data: headerPatch,
          })
        }

        if (hasCandidats) {
          let updates
          try {
            updates = parseCandidatsResultats(body.candidats)
          } catch (e) {
            throw new ApiError(400, e instanceof Error ? e.message : "Données invalides.")
          }

          for (const u of updates) {
            const candidat = byId.get(u.candidatId)
            if (!candidat) {
              throw new ApiError(400, "Candidat introuvable sur cette liste.")
            }

            const data = candidatDataOnResultat(u.resultat)
            await tx.listeExamenCandidat.update({
              where: { id: candidat.id },
              data,
            })

            if (u.resultat === "admis") {
              const elevePatch = eleveUpdateOnAdmis(candidat.eleve, candidat.natureExamen)
              if (elevePatch && Object.keys(elevePatch).length > 0) {
                await tx.eleve.update({
                  where: { id: candidat.eleveId },
                  data: elevePatch,
                })
              }
            }
          }
        }
      },
      PRISMA_TRANSACTION_OPTS,
    )

    if (dateExamenChanged && headerPatch?.dateExamen) {
      await refreshDatesDernierExamenOnListe(prisma, {
        listeId: liste.id,
        autoEcoleId: tenant.autoEcoleId,
        dateExamen: headerPatch.dateExamen,
        candidats: liste.candidats.map((c) => ({
          id: c.id,
          eleveId: c.eleveId,
          natureExamen: c.natureExamen,
        })),
      })
    }

    const [refreshed, categories] = await Promise.all([
      prisma.listeExamen.findFirst({
        where: { id },
        include: {
          candidats: { include: candidatInclude },
          messagesCategorie: { include: { categoriePermis: true } },
        },
      }),
      ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId),
    ])
    if (!refreshed) throw new ApiError(404, "Liste introuvable.")

    return jsonWithCors({ liste: toListeExamenDto(refreshed, categories) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.listeExamen.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Liste introuvable.")
    await prisma.listeExamen.delete({ where: { id } })
    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
