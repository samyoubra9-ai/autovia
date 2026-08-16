import {
  getAllowedOrigins,
  getAppUrls,
  isDevLanOrigin,
} from "@/lib/app-urls"

export function getAllowedOrigin(requestOrigin: string | null): string {
  const origins = getAllowedOrigins()
  if (
    requestOrigin &&
    (origins.includes(requestOrigin) || isDevLanOrigin(requestOrigin))
  ) {
    return requestOrigin
  }
  return origins[0] ?? getAppUrls().backdash
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export function jsonWithCors<T>(data: T, origin: string, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders(origin),
      ...(init?.headers ?? {}),
    },
  })
}
