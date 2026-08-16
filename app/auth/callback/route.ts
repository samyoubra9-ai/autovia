import { NextResponse } from "next/server"

import { appRedirectPath } from "@/lib/app-urls"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/auth/post-login"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(
        next.startsWith("http") ? next : appRedirectPath(request, next),
      )
    }
  }

  return NextResponse.redirect(appRedirectPath(request, "/signin?error=auth_callback"))
}
