import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function requireSiteAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { supabaseUserId: user.id },
  })

  if (!siteAdmin) {
    redirect("/signin?error=no_account")
  }

  return { user, siteAdmin }
}
