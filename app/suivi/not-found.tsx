import Link from "next/link"
import { SearchX } from "lucide-react"

import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuiviNotFound() {
  return (
    <PublicAppShell backHref="/suivi" backLabel="Retour" maxWidth="sm">
      <Card className="text-center shadow-md">
        <CardHeader className="items-center pb-2">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" aria-hidden />
          </div>
          <CardTitle>Code introuvable</CardTitle>
          <CardDescription>
            Ce code de suivi n&apos;existe pas ou a été saisi incorrectement. Vérifiez avec
            votre auto-école.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/suivi">Saisir un autre code</Link>
          </Button>
        </CardContent>
      </Card>
    </PublicAppShell>
  )
}
