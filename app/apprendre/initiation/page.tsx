import type { Metadata } from "next"
import { cookies } from "next/headers"

import { InitiationPageView } from "@/app/components/apprentissage/InitiationPage"
import {
  getInitiationPageDescription,
  getInitiationPageTitle,
} from "@/lib/apprentissage/initiation"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${getInitiationPageTitle(locale)} — ${m.meta.title}`,
    description: getInitiationPageDescription(locale),
  }
}

export default function InitiationPage() {
  return <InitiationPageView />
}
