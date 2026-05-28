import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/context/notifications-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NotificationItem } from '@/components/notifications/notification-item'

export function NotificationBell() {
  const { unread, unreadCount, markAllRead } = useNotifications()
  const preview = unread.slice(0, 8)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[min(360px,50vh)]">
          {preview.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aucune alerte pour le moment.
            </p>
          ) : (
            <ul className="divide-y">
              {preview.map((n) => (
                <NotificationItem key={n.id} notification={n} compact />
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications">Voir toutes les notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
