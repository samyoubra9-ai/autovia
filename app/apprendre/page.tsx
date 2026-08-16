import type { Metadata } from "next"
import { cookies } from "next/headers"

import { ApprentissageDashboard } from "@/app/components/apprentissage/ApprentissageDashboard"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: m.meta.title,
    description: m.meta.description,
  }
}

export default function ApprendrePage() {
  return <ApprentissageDashboard />
}
