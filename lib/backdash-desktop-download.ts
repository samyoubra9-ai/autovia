import { existsSync } from "node:fs"
import { join } from "node:path"

import { getAppUrl, getBackdashDesktopDownloadUrl } from "@/lib/app-urls"

export const BACKDASH_DESKTOP_INSTALLER_FILENAME = "autovia-setup.exe"

export type BackdashDesktopDownload = {
  url: string
  /** Fichier présent (local) ou URL externe configurée */
  ready: boolean
}

/** URL + disponibilité réelle de l'installateur (évite un 404 au clic). */
export function resolveBackdashDesktopDownload(): BackdashDesktopDownload {
  const url = getBackdashDesktopDownloadUrl()
  const explicit = Boolean(process.env.NEXT_PUBLIC_BACKDASH_DESKTOP_URL?.trim())

  if (explicit) {
    return { url, ready: true }
  }

  const filePath = join(
    process.cwd(),
    "public",
    "downloads",
    BACKDASH_DESKTOP_INSTALLER_FILENAME,
  )

  if (!existsSync(filePath)) {
    return { url, ready: false }
  }

  try {
    const appOrigin = new URL(getAppUrl()).origin
    const targetOrigin = new URL(url).origin
    if (appOrigin !== targetOrigin) {
      return { url, ready: true }
    }
  } catch {
    return { url, ready: false }
  }

  return { url, ready: true }
}
