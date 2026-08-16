import type { Metadata } from "next"
import { cookies } from "next/headers"

import { IntersectionsQuizPage } from "@/app/components/apprentissage/IntersectionsQuizPage"
import { INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
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
      module: tTrack(INTERSECTIONS.title, locale),
    }),
    description: m.tracks.intersectionsQuizIntro,
  }
}

export default function IntersectionsQuizRoute() {
  return <IntersectionsQuizPage />
}
