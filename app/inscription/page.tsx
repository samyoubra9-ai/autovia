import type { Metadata } from "next"
import { cookies } from "next/headers"

import { InscriptionView } from "@/app/components/inscription/InscriptionView"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import {
  getBackdashSignInUrl,
  getBackdashSignUpUrl,
  getCandidatUrl,
} from "@/lib/app-urls"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

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
    title: m.inscription.meta.title,
    description: m.inscription.meta.description,
    openGraph: {
      title: m.inscription.meta.title,
      description: m.inscription.meta.description,
      type: "website",
    },
  }
}

export default async function InscriptionPage() {
  const locale = getVitrineLocaleFromCookie(await cookies())

  return <InscriptionView locale={locale} links={getLandingLinks()} />
}
