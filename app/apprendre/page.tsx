import Link from "next/link"
import { BookOpen, Construction } from "lucide-react"

import { AppBrand } from "@/app/components/layout/app-brand"
import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Apprendre",
  description:
    "Quiz et entraînement au code de la route — panneaux, QCM. Bientôt disponible sur Autovia.",
}

export default function ApprendrePage() {
  return (
    <PublicAppShell backHref="/" backLabel="Accueil" maxWidth="md">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center">
          <AppBrand subtitle="Espace apprentissage" />
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Entraînez-vous au code de la route et aux panneaux — quiz gratuits, sans
            compte. Votre score reste sur votre appareil.
          </p>
        </div>

        <div className="w-full rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Construction className="size-7" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Bientôt disponible</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Nous préparons des quiz sur les panneaux et le code de la route. Revenez
            prochainement.
          </p>
          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <BookOpen className="size-4" aria-hidden />
              À venir : quiz panneaux, QCM, score local
            </span>
          </div>
        </div>

        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </PublicAppShell>
  )
}
