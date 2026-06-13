import type { Metadata } from "next"
import { cookies } from "next/headers"

import { VeilleReglementaireView } from "@/app/components/veille/VeilleReglementaireView"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import {
  getBackdashSignInUrl,
  getBackdashSignUpUrl,
  getCandidatUrl,
} from "@/lib/app-urls"
import { resolveBackdashDesktopDownload } from "@/lib/backdash-desktop-download"
import { getReglementationMessages } from "@/lib/i18n/reglementation-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

function getLandingLinks(): LandingLinks {
  const desktop = resolveBackdashDesktopDownload()
  return {
    backdashSignIn: getBackdashSignInUrl(),
    backdashSignUp: getBackdashSignUpUrl(),
    backdashDesktopDownload: desktop.url,
    backdashDesktopDownloadReady: desktop.ready,
    candidatUrl: getCandidatUrl(),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getReglementationMessages(locale)

  return {
    title: m.meta.title,
    description: m.meta.description,
    openGraph: {
      title: m.meta.title,
      description: m.meta.description,
      type: "website",
    },
  }
}

export default async function VeilleReglementairePage() {
  const locale = getVitrineLocaleFromCookie(await cookies())

  return <VeilleReglementaireView locale={locale} links={getLandingLinks()} />
}
