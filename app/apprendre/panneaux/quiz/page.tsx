import type { Metadata } from "next"
import { cookies } from "next/headers"

import { PanneauxQuizPage } from "@/app/components/apprentissage/PanneauxQuizPage"
import { PANNEAUX } from "@/lib/apprentissage/tracks/content"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `Quiz — ${PANNEAUX.title}`,
    description: m.tracks.panneauxQuizIntro,
  }
}

export default function PanneauxQuizRoute() {
  return <PanneauxQuizPage />
}
