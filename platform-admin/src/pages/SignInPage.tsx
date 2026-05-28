import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { fetchAuthStatus } from '@/lib/auth-api'
import { getConfigError } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { getBackdashUrl } from '@/lib/app-urls'

export function SignInPage() {
  const navigate = useNavigate()
  const configError = getConfigError()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setPending(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setPending(false)
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'E-mail ou mot de passe incorrect.'
          : signInError.message,
      )
      return
    }

    try {
      const status = await fetchAuthStatus()
      if (status.role !== 'site_admin') {
        await supabase.auth.signOut()
        if (status.role === 'auto_ecole') {
          window.location.href = getBackdashUrl()
          return
        }
        setError("Ce compte n'est pas administrateur plateforme.")
        return
      }
      void navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion.')
      await supabase.auth.signOut()
    } finally {
      setPending(false)
    }
  }

  if (configError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuration requise</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{configError}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-4">
      <div className="absolute end-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="size-6 text-primary" />
          </div>
          <CardTitle>Admin plateforme</CardTitle>
          <CardDescription>Connexion réservée aux administrateurs Autovia</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
