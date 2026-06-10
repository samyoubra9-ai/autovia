import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { QuizShell } from "@/app/components/apprentissage/QuizShell"
import { isModuleSlug } from "@/lib/apprentissage/curriculum"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import type { ModuleSlug } from "@/lib/apprentissage/types"

type PageProps = {
  params: Promise<{ moduleSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { moduleSlug } = await params
  if (!isModuleSlug(moduleSlug)) return {}

  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getApprentissageMessages(locale)
  const mod = m.modules[moduleSlug as ModuleSlug]

  return {
    title: formatApprentissageMessage(m.quiz.title, { module: mod.title }),
    description: m.quiz.subtitle,
  }
}

export default async function QuizPage({ params }: PageProps) {
  const { moduleSlug } = await params
  if (!isModuleSlug(moduleSlug)) notFound()

  return <QuizShell moduleSlug={moduleSlug} />
}
