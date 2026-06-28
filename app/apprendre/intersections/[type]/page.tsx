import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { IntersectionTypeView } from "@/app/components/apprentissage/IntersectionsViews"
import {
  getIntersectionType,
  INTERSECTIONS,
  isIntersectionType,
} from "@/lib/apprentissage/tracks/content"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return INTERSECTIONS.types.map((type) => ({ type: type.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params
  if (!isIntersectionType(type)) return {}

  const item = getIntersectionType(type)!
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)

  return {
    title: `${item.title} — ${m.meta.title}`,
    description: item.summary,
  }
}

export default async function IntersectionTypePage({ params }: PageProps) {
  const { type } = await params
  if (!isIntersectionType(type)) notFound()

  return <IntersectionTypeView typeSlug={type} />
}
