import type { Metadata } from "next"
import { cookies } from "next/headers"

import { PanneauxQuizPage } from "@/app/components/apprentissage/PanneauxQuizPage"
import { PANNEAUX } from "@/lib/apprentissage/tracks/content"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: formatApprentissageMessage(m.quiz.title, {
      module: tTrack(PANNEAUX.title, locale),
    }),
    description: m.tracks.panneauxQuizIntro,
  }
}

export default function PanneauxQuizRoute() {
  return <PanneauxQuizPage />
}
