import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { LegalPageView } from "@/app/components/legal/LegalPageView"
import {
  getLegalDocumentKey,
  getLegalMessages,
  isLegalSlug,
  type LegalSlug,
} from "@/lib/i18n/legal-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [
    { slug: "mentions-legales" },
    { slug: "confidentialite" },
    { slug: "cgu" },
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  if (!isLegalSlug(slug)) return {}

  const locale = getVitrineLocaleFromCookie(await cookies())
  const legal = getLegalMessages(locale)
  const doc = legal[getLegalDocumentKey(slug as LegalSlug)]

  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
  }
}

export default async function LegalSlugPage({ params }: PageProps) {
  const { slug } = await params
  if (!isLegalSlug(slug)) notFound()

  const locale = getVitrineLocaleFromCookie(await cookies())
  return <LegalPageView slug={slug} locale={locale} />
}
