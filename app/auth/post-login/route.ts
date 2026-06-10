import { NextResponse } from "next/server"

import { getBackdashUrl } from "@/lib/auth-utils"
import { hasAutoEcoleAccess } from "@/lib/access"
import { appRedirectPath } from "@/lib/app-urls"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(appRedirectPath(request, "/signin"))
  }

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { supabaseUserId: user.id },
  })

  if (siteAdmin) {
    return NextResponse.redirect(appRedirectPath(request, "/admin/apprentissage"))
  }

  const adminCount = await prisma.siteAdmin.count()
  if (adminCount === 0) {
    return NextResponse.redirect(appRedirectPath(request, "/setup-admin"))
  }

  const tenantUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    include: { autoEcole: true },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const backdash = getBackdashUrl()

  function backdashCallbackWithSession(path = "/auth/callback") {
    if (session?.access_token && session.refresh_token) {
      const hash = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        token_type: "bearer",
      }).toString()
      return NextResponse.redirect(`${backdash}${path}#${hash}`)
    }
    return NextResponse.redirect(`${backdash}/sign-in`)
  }

  if (tenantUser) {
    if (!hasAutoEcoleAccess(tenantUser.autoEcole)) {
      return backdashCallbackWithSession("/trial-expired")
    }
    return backdashCallbackWithSession()
  }

  // Compte Google sans auto-école → wizard backdash (essai 15 jours après inscription)
  return backdashCallbackWithSession()
}
