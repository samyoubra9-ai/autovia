import { useNotifications } from '@/context/notifications-provider'
import { SUBSCRIPTION_WARN_DAYS } from '@/lib/admin-notifications'
import { AdminPageHeader } from '@/components/layout/admin-shell'
import { NotificationItem } from '@/components/notifications/notification-item'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function NotificationsPage() {
  const { all, unread, markAllRead, unreadCount } = useNotifications()
  const read = all.filter((n) => !unread.some((u) => u.id === n.id))

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description={`Alertes automatiques : essai ou abonnement dans les ${SUBSCRIPTION_WARN_DAYS} prochains jours, nouveaux clients, comptes en attente.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">Non lues ({unreadCount})</TabsTrigger>
          <TabsTrigger value="all">Toutes ({all.length})</TabsTrigger>
          <TabsTrigger value="read">Lues ({read.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="unread" className="mt-4">
          <NotificationList items={unread} empty="Aucune notification non lue." />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <NotificationList items={all} empty="Aucune notification." />
        </TabsContent>
        <TabsContent value="read" className="mt-4">
          <NotificationList items={read} empty="Aucune notification lue." />
        </TabsContent>
      </Tabs>
    </>
  )
}

function NotificationList({
  items,
  empty,
}: {
  items: ReturnType<typeof useNotifications>['all']
  empty: string
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {empty}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centre de notifications</CardTitle>
        <CardDescription>Cliquez sur un client pour agir sur son accès.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
