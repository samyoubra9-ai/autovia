import type { Metadata } from "next"
import { Suspense } from "react"

import { SigninForm } from "@/app/components/auth/SigninForm"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Connexion",
}

function SigninFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Chargement…
        </CardContent>
      </Card>
    </div>
  )
}

export default function SigninPage() {
  return (
    <Suspense fallback={<SigninFallback />}>
      <SigninForm />
    </Suspense>
  )
}
