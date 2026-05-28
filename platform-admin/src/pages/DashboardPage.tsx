import { Link } from 'react-router-dom'
import { ArrowRight, Bell } from 'lucide-react'
import { useClients } from '@/context/clients-provider'
import { useNotifications } from '@/context/notifications-provider'
import { AdminPageHeader } from '@/components/layout/admin-shell'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { NotificationItem } from '@/components/notifications/notification-item'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const { stats, loading, error } = useClients()
  const { unread } = useNotifications()
  const urgent = unread.filter((n) => n.priority === 'high').slice(0, 5)

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord"
        description="Vue d’ensemble et alertes abonnements / essais."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <StatsCards stats={stats} />

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-5" />
                  Alertes récentes
                </CardTitle>
                <CardDescription>
                  Essai ou abonnement qui se termine dans les 2 prochains jours
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/notifications">
                  Tout voir
                  <ArrowRight className="ms-1 size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {urgent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte urgente.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {urgent.map((n) => (
                    <NotificationItem key={n.id} notification={n} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/clients/new">Créer une auto-école</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/clients">Liste des clients</Link>
            </Button>
          </div>
        </>
      )}
    </>
  )
}
