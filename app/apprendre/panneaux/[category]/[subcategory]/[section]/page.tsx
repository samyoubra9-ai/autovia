import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { PanneauSectionView } from "@/app/components/apprentissage/PanneauxViews"
import {
  getPanneauCategory,
  getPanneauSection,
  isPanneauFamilySlug,
  isPanneauSection,
  PANNEAUX,
} from "@/lib/apprentissage/tracks/content"
import { tTrack } from "@/lib/apprentissage/tracks/localize"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ category: string; subcategory: string; section: string }>
}

export function generateStaticParams() {
  return PANNEAUX.families.flatMap((family) =>
    (family.categories ?? []).flatMap((cat) =>
      (cat.sections ?? []).map((section) => ({
        category: family.slug,
        subcategory: cat.slug,
        section: section.slug,
      })),
    ),
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subcategory, section } = await params
  const panneauSection = getPanneauSection(subcategory, section)
  if (!panneauSection) return {}

  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)
  const cat = getPanneauCategory(subcategory)

  return {
    title: `${tTrack(cat?.title ?? "", locale)} — ${tTrack(panneauSection.title, locale)} — ${m.meta.title}`,
    description: tTrack(panneauSection.description, locale),
  }
}

export default async function PanneauSectionPage({ params }: PageProps) {
  const { category, subcategory, section } = await params
  if (!isPanneauFamilySlug(category)) notFound()
  if (!isPanneauSection(subcategory, section)) notFound()

  return (
    <PanneauSectionView
      familySlug={category}
      categorySlug={subcategory}
      sectionSlug={section}
    />
  )
}
