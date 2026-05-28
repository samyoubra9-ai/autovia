import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { resolveEleveIdBySuiviCode } from "@/lib/push/resolve-eleve"
import { parsePushSubscription } from "@/lib/push/subscription"
import { isPushConfigured } from "@/lib/push/vapid"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    if (!isPushConfigured()) {
      throw new ApiError(503, "Notifications push non configurées sur le serveur.")
    }

    const body = (await request.json()) as Record<string, unknown>
    const code = String(body.code ?? "").trim()
    const subscription = parsePushSubscription(body.subscription)
    const eleveId = await resolveEleveIdBySuiviCode(code)

    await prisma.candidatPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        eleveId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
      update: {
        eleveId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: request.headers.get("user-agent"),
      },
    })

    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
