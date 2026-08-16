import type { Metadata } from "next"
import { cookies } from "next/headers"

import { AutoviaLanding } from "./components/AutoviaLanding"
import type { LandingLinks } from "./components/landing/landing-links"
import { VitrineLocaleProvider } from "./components/vitrine/VitrineLocaleProvider"
import {
  getBackdashSignInUrl,
  getBackdashSignUpUrl,
  getCandidatUrl,
} from "@/lib/app-urls"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"

import "./landing.css"

function getLandingLinks(): LandingLinks {
  return {
    backdashSignIn: getBackdashSignInUrl(),
    backdashSignUp: getBackdashSignUpUrl(),
    candidatUrl: getCandidatUrl(),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getVitrineMessages(locale)

  return {
    title: m.meta.homeTitle,
    description: m.meta.homeDescription,
    openGraph: {
      title: m.meta.homeOgTitle,
      description: m.meta.homeOgDescription,
      type: "website",
    },
  }
}

export default async function Home() {
  const locale = getVitrineLocaleFromCookie(await cookies())

  return (
    <VitrineLocaleProvider locale={locale}>
      <AutoviaLanding links={getLandingLinks()} />
    </VitrineLocaleProvider>
  )
}
