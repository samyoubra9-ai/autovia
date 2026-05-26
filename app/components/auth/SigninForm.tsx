"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { AppBrand } from "@/app/components/layout/app-brand"
import { PublicAppShell } from "@/app/components/layout/public-app-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

const ERRORS: Record<string, string> = {
  auth_callback: "La connexion a échoué. Réessayez.",
  no_account: "Aucun compte associé à cet e-mail. Contactez l'administrateur de la plateforme.",
  access_blocked:
    "Votre accès est bloqué ou expiré. Contactez l'administrateur Autovia après votre paiement.",
}

export function SigninForm() {
  const searchParams = useSearchParams()
  const queryError = searchParams.get("error")
  const initialError = queryError ? (ERRORS[queryError] ?? "Erreur de connexion.") : null

  const [error, setError] = useState<string | null>(initialError)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "E-mail ou mot de passe incorrect."
          : signInError.message,
      )
      setPending(false)
      return
    }

    window.location.href = "/auth/post-login"
  }

  return (
    <PublicAppShell backHref="/" backLabel="Accueil" maxWidth="sm">
      <div className="flex flex-col items-center gap-6">
        <AppBrand subtitle="Espace administrateur" />

        <Card className="w-full border-border/80 shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Accédez à votre tableau de bord auto-école ou à l&apos;administration
              Autovia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="vous@autoecole.dz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Connexion…
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/30 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Créer une auto-école
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PublicAppShell>
  )
}
