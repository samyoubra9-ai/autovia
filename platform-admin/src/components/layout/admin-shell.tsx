import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Building2,
  LayoutDashboard,
  LogOut,
  Plus,
  Shield,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/context/notifications-provider'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/clients', label: 'Auto-écoles', icon: Users },
  { to: '/clients/new', label: 'Nouveau compte', icon: Plus },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
]

type Props = {
  children?: React.ReactNode
}

export function AdminShell({ children }: Props) {
  const { email, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const location = useLocation()
  const content = children ?? <Outlet />

  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Shield className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold leading-none">Autovia</p>
            <p className="text-xs text-muted-foreground">Admin plateforme</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            const badge =
              item.badge && item.to === '/notifications' && unreadCount > 0
                ? unreadCount
                : null
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                {badge != null && (
                  <Badge
                    variant={active ? 'secondary' : 'destructive'}
                    className="h-5 min-w-5 justify-center px-1 text-[10px]"
                  >
                    {badge > 9 ? '9+' : badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <ThemeToggle />
          </div>
          <p className="truncate px-3 text-xs text-muted-foreground" title={email ?? ''}>
            {email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => void signOut().then(() => (window.location.href = '/sign-in'))}
          >
            <LogOut className="size-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Building2 className="size-5 text-primary" />
            <span className="font-semibold">Drive Admin</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            Gestion des auto-écoles et des accès backdash
          </p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <Button size="sm" className="gap-2" asChild>
              <Link to="/clients/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Nouvelle auto-école</span>
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{content}</main>
      </div>
    </div>
  )
}

export function AdminPageHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Separator className="mt-4" />
    </div>
  )
}
