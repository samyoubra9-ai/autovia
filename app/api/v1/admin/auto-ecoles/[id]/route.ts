import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import {
  applySiteAdminAccessUpdate,
  type SiteAdminAccessPatchBody,
} from "@/lib/api/site-admin-access-update"
import { toSiteAdminAutoEcoleDto } from "@/lib/api/site-admin-dto"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

const accessInclude = {
  users: { where: { role: "OWNER" as const }, take: 1 },
  _count: {
    select: {
      eleves: true,
      users: true,
      moniteurs: true,
      vehicules: true,
      listesExamen: true,
    },
  },
}

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)
    const { id } = await params
    const body = (await request.json()) as SiteAdminAccessPatchBody

    const autoEcole = await prisma.autoEcole.findUnique({ where: { id } })
    if (!autoEcole) {
      throw new ApiError(404, "Auto-école introuvable.")
    }

    const onlyMeta =
      body.adminNotes !== undefined &&
      body.action === undefined &&
      body.subscriptionStatus === undefined

    if (onlyMeta) {
      const updated = await prisma.autoEcole.update({
        where: { id },
        data: { adminNotes: String(body.adminNotes).trim() || null },
        include: accessInclude,
      })
      return jsonWithCors(
        { autoEcole: toSiteAdminAutoEcoleDto(updated), message: "Notes enregistrées." },
        origin,
      )
    }

    let patch: ReturnType<typeof applySiteAdminAccessUpdate>
    try {
      patch = applySiteAdminAccessUpdate(autoEcole, body)
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "Action invalide.")
    }

    const updated = await prisma.autoEcole.update({
      where: { id },
      data: {
        subscriptionStatus: patch.subscriptionStatus,
        trialEndsAt: patch.trialEndsAt,
        paidUntil: patch.paidUntil,
        ...(body.adminNotes !== undefined
          ? { adminNotes: String(body.adminNotes).trim() || null }
          : {}),
      },
      include: accessInclude,
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
