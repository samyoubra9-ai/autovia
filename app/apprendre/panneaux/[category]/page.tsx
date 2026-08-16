import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { PanneauFamilyView } from "@/app/components/apprentissage/PanneauxViews"
import {
  getPanneauFamily,
  isPanneauCategory,
  isPanneauFamilySlug,
  PANNEAUX,
} from "@/lib/apprentissage/tracks/content"
import { getPanneauCategoryHref } from "@/lib/apprentissage/tracks/routes"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return PANNEAUX.families.map((f) => ({ category: f.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  if (!isPanneauFamilySlug(category)) return {}

  const family = getPanneauFamily(category)!
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${tTrack(family.title, locale)} — ${m.meta.title}`,
    description: tTrack(family.description, locale),
  }
}

export default async function PanneauFamilyOrLegacyPage({ params }: PageProps) {
  const { category } = await params

  if (isPanneauFamilySlug(category)) {
    return <PanneauFamilyView familySlug={category} />
  }

  if (isPanneauCategory(category)) {
    const familySlug =
      PANNEAUX.families.find((f) =>
        f.categories?.some((c) => c.slug === category),
      )?.slug ?? "vertical"
    redirect(getPanneauCategoryHref(familySlug, category))
  }

  notFound()
}
