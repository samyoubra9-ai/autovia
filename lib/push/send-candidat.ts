import webpush from "web-push"

import { getCandidatUrl } from "@/lib/app-urls"
import { prisma } from "@/lib/prisma"
import { getVapidConfig } from "@/lib/push/vapid"

export type CandidatPushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  urgent?: boolean
}

function buildAbsoluteUrl(path: string): string {
  const base = getCandidatUrl().replace(/\/$/, "")
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export async function sendCandidatPushToEleve(
  eleveId: string,
  payload: CandidatPushPayload,
): Promise<void> {
  const vapid = getVapidConfig()
  if (!vapid) return

  const subs = await prisma.candidatPushSubscription.findMany({
    where: { eleveId },
  })
  if (subs.length === 0) return

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: buildAbsoluteUrl(payload.url ?? "/"),
    tag: payload.tag ?? `autovia-${eleveId}`,
    urgent: payload.urgent ?? false,
    icon: buildAbsoluteUrl("/icons/icon-192.png"),
  })

  const deadIds: string[] = []

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 60 * 60 * 24 },
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) deadIds.push(sub.id)
        else console.error("[push] send failed", sub.id, err)
      }
    }),
  )

  if (deadIds.length > 0) {
    await prisma.candidatPushSubscription.deleteMany({
      where: { id: { in: deadIds } },
    })
  }
}

export function fireCandidatPush(
  eleveId: string,
  payload: CandidatPushPayload,
): void {
  void sendCandidatPushToEleve(eleveId, payload).catch((err) => {
    console.error("[push] fireCandidatPush", err)
  })
}
