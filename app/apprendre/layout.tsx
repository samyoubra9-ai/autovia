import { cookies } from "next/headers"

import { ApprentissageShell } from "@/app/components/apprentissage/ApprentissageShell"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getVitrineLocaleFromCookie } from "@/lib/i18n/vitrine-locale"

import "../app-theme.css"
import "../apprentissage.css"
import "../apprentissage-initiation.css"

export default async function ApprendreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = getVitrineLocaleFromCookie(await cookies())

  return (
    <VitrineLocaleProvider locale={locale}>
      <ApprentissageShell>{children}</ApprentissageShell>
    </VitrineLocaleProvider>
  )
}
