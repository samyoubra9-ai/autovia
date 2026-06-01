import type { PrismaDb } from "@/lib/prisma"

export async function logSiteAdminAction(
  prisma: PrismaDb,
  params: {
    siteAdminId: string
    autoEcoleId: string
    action: string
    detail?: string | null
  },
): Promise<void> {
  try {
    await prisma.siteAdminAuditLog.create({
      data: {
        siteAdminId: params.siteAdminId,
        autoEcoleId: params.autoEcoleId,
        action: params.action,
        detail: params.detail?.trim() || null,
      },
    })
  } catch (e) {
    console.error("[site-admin-audit] log failed", e)
  }
}

export type SiteAdminAuditLogDto = {
  id: string
  action: string
  detail: string | null
  createdAt: string
  adminEmail: string | null
}

export async function listSiteAdminAuditLogs(
  prisma: PrismaDb,
  autoEcoleId: string,
  limit = 15,
): Promise<SiteAdminAuditLogDto[]> {
  const rows = await prisma.siteAdminAuditLog.findMany({
    where: { autoEcoleId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { siteAdmin: { select: { email: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    detail: r.detail,
    createdAt: r.createdAt.toISOString(),
    adminEmail: r.siteAdmin?.email ?? null,
  }))
}
