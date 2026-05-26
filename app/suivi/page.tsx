import { AppBrand } from "@/app/components/layout/app-brand"
import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { SuiviCodeForm } from "@/app/components/suivi/SuiviCodeForm"

export const metadata = {
  title: "Suivi candidat",
  description: "Consultez votre parcours et vos séances avec votre code de suivi.",
}

export default function SuiviLandingPage() {
  return (
    <PublicAppShell backHref="/" backLabel="Accueil" maxWidth="md">
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center text-center">
          <AppBrand subtitle="Portail candidat" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Suivez votre parcours de formation, vos paiements et vos prochaines séances en
            toute confidentialité.
          </p>
        </div>
        <SuiviCodeForm />
      </div>
    </PublicAppShell>
  )
}
