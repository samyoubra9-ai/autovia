import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { corsHeaders, getAllowedOrigin } from "@/lib/api/cors"
import { getBackdashUrl } from "@/lib/auth-utils"

type CookieToSet = {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

/** OAuth Google : si Supabase renvoie sur Next (site_url 3000), transférer le code vers le backdash. */
function redirectOAuthCodeToBackdash(request: NextRequest): NextResponse | null {
  const url = request.nextUrl
  const code = url.searchParams.get("code")
  if (!code || url.pathname.startsWith("/api/")) return null

  const stayOnNext =
    url.pathname === "/auth/callback" &&
    (url.searchParams.get("next")?.startsWith("/auth/post-login") ?? false)

  if (stayOnNext) return null

  const dest = new URL("/auth/callback", getBackdashUrl())
  url.searchParams.forEach((value, key) => dest.searchParams.set(key, value))
  return NextResponse.redirect(dest)
}

export async function middleware(request: NextRequest) {
  const oauthRedirect = redirectOAuthCodeToBackdash(request)
  if (oauthRedirect) return oauthRedirect

  const isApi = request.nextUrl.pathname.startsWith("/api/")
  const origin = getAllowedOrigin(request.headers.get("origin"))

  if (isApi && request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  await supabase.auth.getUser()

  if (isApi) {
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      supabaseResponse.headers.set(key, value)
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
