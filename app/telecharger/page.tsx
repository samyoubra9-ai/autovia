import type { Metadata } from "next"
import { cookies } from "next/headers"

import { TelechargerView } from "@/app/components/telecharger/TelechargerView"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import {
  getBackdashSignInUrl,
  getBackdashSignUpUrl,
  getCandidatUrl,
} from "@/lib/app-urls"
import { resolveBackdashDesktopDownload } from "@/lib/backdash-desktop-download"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"

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
  const m = getVitrineMessages(locale)

  return {
    title: m.desktop.pageTitle,
    description: m.desktop.pageDescription,
    openGraph: {
      title: m.desktop.pageTitle,
      description: m.desktop.pageDescription,
      type: "website",
    },
  }
}

export default async function TelechargerPage() {
  const locale = getVitrineLocaleFromCookie(await cookies())

  return <TelechargerView locale={locale} links={getLandingLinks()} />
}
