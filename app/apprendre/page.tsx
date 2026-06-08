import Link from "next/link"
import { BookOpen, Construction } from "lucide-react"
import { cookies } from "next/headers"
import type { Metadata } from "next"

import { AppBrand } from "@/app/components/layout/app-brand"
import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { Button } from "@/components/ui/button"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"

export async function generateMetadata(): Promise<Metadata> {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getVitrineMessages(locale)

  return {
    title: m.apprendre.title,
    description: m.apprendre.description,
  }
}

export default async function ApprendrePage() {
  const locale = getVitrineLocaleFromCookie(await cookies())
  const m = getVitrineMessages(locale)

  return (
    <VitrineLocaleProvider locale={locale}>
      <PublicAppShell backHref="/" backLabel={m.apprendre.backLabel} maxWidth="md">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center">
            <AppBrand subtitle={m.apprendre.brandSubtitle} />
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              {m.apprendre.intro}
            </p>
          </div>

          <div className="w-full rounded-2xl border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Construction className="size-7" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {m.apprendre.comingSoonTitle}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {m.apprendre.comingSoonText}
            </p>
            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <BookOpen className="size-4" aria-hidden />
                {m.apprendre.comingSoonHint}
              </span>
            </div>
          </div>

          <Button asChild variant="outline">
            <Link href="/">{m.apprendre.backHome}</Link>
          </Button>
        </div>
      </PublicAppShell>
    </VitrineLocaleProvider>
  )
}
