import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { PanneauCategoryView } from "@/app/components/apprentissage/PanneauxViews"
import { getPanneauCategory, isPanneauCategory, PANNEAUX } from "@/lib/apprentissage/tracks/content"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return PANNEAUX.categories.map((cat) => ({ category: cat.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  if (!isPanneauCategory(category)) return {}

  const cat = getPanneauCategory(category)!
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${cat.title} — ${m.meta.title}`,
    description: cat.description,
  }
}

export default async function PanneauCategoryPage({ params }: PageProps) {
  const { category } = await params
  if (!isPanneauCategory(category)) notFound()

  return <PanneauCategoryView categorySlug={category} />
}
