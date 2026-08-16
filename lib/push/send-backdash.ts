import webpush from "web-push"

import { getBackdashUrl } from "@/lib/app-urls"
import { prisma } from "@/lib/prisma"
import { getVapidConfig } from "@/lib/push/vapid"

export type BackdashPushPayload = {
  title: string
  body: string
  url?: string
  tag?: string
  urgent?: boolean
}

function buildAbsoluteUrl(path: string): string {
  const base = getBackdashUrl().replace(/\/$/, "")
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export async function sendBackdashPushToAutoEcole(
  autoEcoleId: string,
  payload: BackdashPushPayload,
): Promise<void> {
  const vapid = getVapidConfig()
  if (!vapid) return

  const subs = await prisma.backdashPushSubscription.findMany({
    where: { autoEcoleId },
  })
  if (subs.length === 0) return

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey)

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: buildAbsoluteUrl(payload.url ?? "/"),
    tag: payload.tag ?? `autovia-backdash-${autoEcoleId}`,
    urgent: payload.urgent ?? false,
    icon: buildAbsoluteUrl("/images/pwa/icon-192.png"),
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
        else console.error("[push:backdash] send failed", sub.id, err)
      }
    }),
  )

  if (deadIds.length > 0) {
    await prisma.backdashPushSubscription.deleteMany({
      where: { id: { in: deadIds } },
    })
  }
}

export function fireBackdashPush(
  autoEcoleId: string,
  payload: BackdashPushPayload,
): void {
  void sendBackdashPushToAutoEcole(autoEcoleId, payload).catch((err) => {
    console.error("[push:backdash] fireBackdashPush", err)
  })
}
