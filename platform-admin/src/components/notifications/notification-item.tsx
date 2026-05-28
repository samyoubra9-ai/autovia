import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Sparkles, UserPlus } from 'lucide-react'
import type { AdminNotification } from '@/lib/admin-notifications'
import { useNotifications } from '@/context/notifications-provider'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const icons = {
  trial_expiring: Clock,
  subscription_expiring: AlertTriangle,
  trial_ended: AlertTriangle,
  subscription_ended: AlertTriangle,
  new_client: UserPlus,
  awaiting_activation: Sparkles,
} as const

type Props = {
  notification: AdminNotification
  compact?: boolean
}

export function NotificationItem({ notification, compact }: Props) {
  const { isRead, markRead } = useNotifications()
  const read = isRead(notification.id)
  const Icon = icons[notification.type]

  const priorityBadge =
    notification.priority === 'high' ? (
      <Badge variant="destructive" className="text-[10px]">
        Urgent
      </Badge>
    ) : notification.priority === 'medium' ? (
      <Badge variant="secondary" className="text-[10px]">
        Bientôt
      </Badge>
    ) : null

  return (
    <li
      className={cn(
        'px-4 py-3 transition-colors hover:bg-muted/50',
        !read && 'bg-primary/5',
        compact && 'py-2.5',
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
            notification.priority === 'high'
              ? 'bg-destructive/10 text-destructive'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-sm font-medium', !read && 'text-foreground')}>
              {notification.title}
            </p>
            {priorityBadge}
          </div>
          <p className="text-xs text-muted-foreground">{notification.message}</p>
          {notification.daysLeft !== undefined && (
            <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              {notification.daysLeft === 0
                ? "Expire aujourd'hui"
                : `${notification.daysLeft} jour(s) restant(s)`}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
              <Link
                to={`/clients?highlight=${notification.autoEcoleId}`}
                onClick={() => markRead(notification.id)}
              >
                Voir le client
              </Link>
            </Button>
            {!read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markRead(notification.id)}
              >
                Marquer lu
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
