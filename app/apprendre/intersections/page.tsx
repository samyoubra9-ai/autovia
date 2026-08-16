import type { Metadata } from "next"
import { cookies } from "next/headers"

import { IntersectionsOverview } from "@/app/components/apprentissage/IntersectionsViews"
import { INTERSECTIONS } from "@/lib/apprentissage/tracks/content"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${tTrack(INTERSECTIONS.title, locale)} — ${m.meta.title}`,
    description: tTrack(INTERSECTIONS.description, locale),
  }
}

export default function IntersectionsPage() {
  return <IntersectionsOverview />
}
