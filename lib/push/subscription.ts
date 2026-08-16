import { ApiError } from "@/lib/api/errors"

export type PushSubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function parsePushSubscription(raw: unknown): PushSubscriptionInput {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(400, "Abonnement push invalide.")
  }
  const sub = raw as Record<string, unknown>
  const endpoint = String(sub.endpoint ?? "").trim()
  const keys = sub.keys as Record<string, unknown> | undefined
  const p256dh = String(keys?.p256dh ?? "").trim()
  const auth = String(keys?.auth ?? "").trim()

  if (!endpoint || !p256dh || !auth) {
    throw new ApiError(400, "Abonnement push incomplet.")
  }

  return { endpoint, keys: { p256dh, auth } }
}
