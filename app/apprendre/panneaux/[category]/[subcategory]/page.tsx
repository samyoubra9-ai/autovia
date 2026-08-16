import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"

import {
  PanneauCategoryHubView,
  PanneauCategoryView,
} from "@/app/components/apprentissage/PanneauxViews"
import {
  categoryHasSections,
  getPanneauCategory,
  getPanneauFamily,
  isPanneauCategory,
  isPanneauFamilySlug,
  PANNEAUX,
} from "@/lib/apprentissage/tracks/content"
import {
  getPanneauCategoryHref,
  getPanneauSectionHref,
} from "@/lib/apprentissage/tracks/routes"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ category: string; subcategory: string }>
}

export function generateStaticParams() {
  return PANNEAUX.families.flatMap((f) =>
    (f.categories ?? []).map((cat) => ({
      category: f.slug,
      subcategory: cat.slug,
    })),
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params
  if (!isPanneauFamilySlug(category)) return {}

  const cat = getPanneauCategory(subcategory)
  if (!cat) return {}

  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${tTrack(cat.title, locale)} — ${m.meta.title}`,
    description: tTrack(cat.description, locale),
  }
}

export default async function PanneauCategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params
  if (!isPanneauFamilySlug(category)) notFound()

  const family = getPanneauFamily(category)
  const cat = family?.categories?.find((c) => c.slug === subcategory)
  if (!family || !cat) notFound()

  if (subcategory === "fin-interdiction") {
    redirect(getPanneauSectionHref(category, "interdiction", "fin"))
  }
  if (subcategory === "fin-obligation") {
    redirect(getPanneauSectionHref(category, "obligation", "fin"))
  }

  if (categoryHasSections(cat)) {
    return (
      <PanneauCategoryHubView
        familySlug={category}
        categorySlug={subcategory}
      />
    )
  }

  return <PanneauCategoryView familySlug={category} categorySlug={subcategory} />
}
