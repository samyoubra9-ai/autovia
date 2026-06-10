import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { ModuleOverview } from "@/app/components/apprentissage/ModuleOverview"
import { isModuleSlug } from "@/lib/apprentissage/curriculum"
import { getApprentissageMessages } from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import type { ModuleSlug } from "@/lib/apprentissage/types"

type PageProps = {
  params: Promise<{ moduleSlug: string }>
}

export function generateStaticParams() {
  return [
    { moduleSlug: "fondamentaux" },
    { moduleSlug: "circulation" },
    { moduleSlug: "conducteur" },
    { moduleSlug: "situations" },
  ]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug } = await params
  if (!isModuleSlug(moduleSlug)) return {}

  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)
  const mod = m.modules[moduleSlug as ModuleSlug]

  return {
    title: mod.title,
    description: mod.description,
  }
}

export default async function ModulePage({ params }: PageProps) {
  const { moduleSlug } = await params
  if (!isModuleSlug(moduleSlug)) notFound()

  return <ModuleOverview moduleSlug={moduleSlug} />
}
