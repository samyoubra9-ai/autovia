import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import type { ReactNode } from 'react'

export function RequireSiteAdmin({ children }: { children: ReactNode }) {
  const { loading, session, isSiteAdmin } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />
  }

  if (!isSiteAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Accès réservé aux administrateurs plateforme.{' '}
            <a href="/sign-in" className="text-primary underline">
              Retour connexion
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
