import { getCandidatUrl } from "@/lib/app-urls"

export type VapidConfig = {
  subject: string
  publicKey: string
  privateKey: string
}

export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  if (!publicKey || !privateKey) return null

  const subject =
    process.env.VAPID_SUBJECT?.trim() ||
    `mailto:contact@${safeHostname(getCandidatUrl())}`

  return { subject, publicKey, privateKey }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return "autovia.space"
  }
}

export function isPushConfigured(): boolean {
  return getVapidConfig() !== null
}
