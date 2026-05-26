import { ApiError } from "@/lib/api/errors"
import { requireAuthUser } from "@/lib/api/auth"
import { prisma } from "@/lib/prisma"

export async function requireSiteAdminApi(request: Request) {
  const authUser = await requireAuthUser(request)

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { supabaseUserId: authUser.id },
  })

  if (!siteAdmin) {
    throw new ApiError(403, "Accès réservé aux administrateurs plateforme.", "SITE_ADMIN_REQUIRED")
  }

  return { authUser, siteAdmin }
}
