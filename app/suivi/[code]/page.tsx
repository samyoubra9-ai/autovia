import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { SuiviPortal } from "@/app/components/suivi/SuiviPortal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ApiError } from "@/lib/api/errors"
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/api/network"
import { getSuiviPublicByCode } from "@/lib/api/suivi-public"

type PageProps = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  return {
    title: `Suivi ${code}`,
    description: "Parcours et séances du candidat",
  }
}

export default async function SuiviCodePage({ params }: PageProps) {
  const { code } = await params

  try {
    const data = await getSuiviPublicByCode(code)
    return (
      <PublicAppShell backHref="/suivi" backLabel="Autre code" maxWidth="lg">
        <SuiviPortal data={data} />
      </PublicAppShell>
    )
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()

    const message =
      e instanceof ApiError
        ? e.message
        : isNetworkError(e)
          ? NETWORK_ERROR_MESSAGE
          : "Impossible de charger le dossier. Réessayez plus tard."

    return (
      <PublicAppShell backHref="/suivi" backLabel="Retour" maxWidth="sm">
        <Card className="text-center shadow-md">
          <CardContent className="space-y-4 py-10">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button asChild>
              <Link href="/suivi">
                <ArrowLeft className="size-4" aria-hidden />
                Réessayer
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PublicAppShell>
    )
  }
}
