import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import {
  applySiteAdminAccessUpdate,
  resolveSiteAdminAccessAction,
  type SiteAdminAccessPatchBody,
} from "@/lib/api/site-admin-access-update"
import { logSiteAdminAction } from "@/lib/api/site-admin-audit"
import {
  buildBillingRecordFromAccessPatch,
  createSubscriptionBillingRecord,
  shouldRecordBillingOnAccessAction,
} from "@/lib/api/subscription-billing"
import {
  buildSiteAdminMetaUpdateData,
  isSiteAdminMetaOnlyPatch,
} from "@/lib/api/site-admin-meta-update"
import { siteAdminAutoEcoleInclude, toSiteAdminAutoEcoleDto } from "@/lib/api/site-admin-dto"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const { siteAdmin } = await requireSiteAdminApi(request)
    const { id } = await params
    const body = (await request.json()) as SiteAdminAccessPatchBody

    const autoEcole = await prisma.autoEcole.findUnique({
      where: { id },
      include: { _count: { select: { eleves: true } } },
    })
    if (!autoEcole) {
      throw new ApiError(404, "Auto-école introuvable.")
    }

    if (isSiteAdminMetaOnlyPatch(body)) {
      let metaData: Record<string, unknown>
      try {
        metaData = buildSiteAdminMetaUpdateData(body, autoEcole)
      } catch (e) {
        throw new ApiError(400, e instanceof Error ? e.message : "Données invalides.")
      }

      const updated = await prisma.autoEcole.update({
        where: { id },
        data: metaData,
        include: siteAdminAutoEcoleInclude,
      })

      await logSiteAdminAction(prisma, {
        siteAdminId: siteAdmin.id,
        autoEcoleId: id,
        action: "meta_update",
        detail: Object.keys(metaData).join(", "),
      })

      return jsonWithCors(
        { autoEcole: toSiteAdminAutoEcoleDto(updated), message: "Informations enregistrées." },
        origin,
      )
    }

    let patch: ReturnType<typeof applySiteAdminAccessUpdate>
    try {
      patch = applySiteAdminAccessUpdate(autoEcole, body)
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Action invalide.")
    }

    let maxElevesOverride: number | null | undefined
    if (body.maxElevesOverride !== undefined) {
      try {
        maxElevesOverride = buildSiteAdminMetaUpdateData(
          { maxElevesOverride: body.maxElevesOverride },
          autoEcole,
        ).maxElevesOverride as number | null
      } catch (e) {
        throw new ApiError(400, e instanceof Error ? e.message : "Quota override invalide.")
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.autoEcole.update({
        where: { id },
        data: {
          subscriptionStatus: patch.subscriptionStatus,
          subscriptionPlan: patch.subscriptionPlan,
          trialEndsAt: patch.trialEndsAt,
          paidUntil: patch.paidUntil,
          ...(body.adminNotes !== undefined
            ? { adminNotes: String(body.adminNotes).trim() || null }
            : {}),
          ...(maxElevesOverride !== undefined ? { maxElevesOverride } : {}),
        },
        include: siteAdminAutoEcoleInclude,
      })

      const action = body.action ?? resolveSiteAdminAccessAction(autoEcole, body)
      const billingDraft = buildBillingRecordFromAccessPatch(action, body, patch)
      if (billingDraft && shouldRecordBillingOnAccessAction(action, body.recordBilling)) {
        await createSubscriptionBillingRecord(tx, {
          ...billingDraft,
          autoEcoleId: id,
          siteAdminId: siteAdmin.id,
        })
      }

      return row
    })

    await logSiteAdminAction(prisma, {
      siteAdminId: siteAdmin.id,
      autoEcoleId: id,
      action: body.action ?? "access_update",
      detail: patch.message,
    })

    return jsonWithCors(
      {
        autoEcole: toSiteAdminAutoEcoleDto(updated),
        message: patch.message,
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)
    const { id } = await params

    const row = await prisma.autoEcole.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eleves: true,
            moniteurs: true,
            vehicules: true,
            paiements: true,
            seancesExamen: true,
            listesExamen: true,
            users: true,
          },
        },
      },
    })
    if (!row) throw new ApiError(404, "Auto-école introuvable.")

    await prisma.autoEcole.delete({ where: { id } })

    return jsonWithCors(
      {
        ok: true,
        message: `Compte « ${row.nom} » supprimé définitivement.`,
        deleted: {
          eleves: row._count.eleves,
          moniteurs: row._count.moniteurs,
          vehicules: row._count.vehicules,
          paiements: row._count.paiements,
          seancesExamen: row._count.seancesExamen,
          listesExamen: row._count.listesExamen,
          users: row._count.users,
        },
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
