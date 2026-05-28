import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import type { AdminNotification } from '@/lib/admin-notifications'
import { useDerivedNotifications } from '@/context/clients-provider'

const STORAGE_KEY = 'platform-admin-notif-read-v1'

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

type NotificationsContextValue = {
  all: AdminNotification[]
  unread: AdminNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  isRead: (id: string) => boolean
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const all = useDerivedNotifications()
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)
  const [toastedHigh, setToastedHigh] = useState(false)

  const unread = useMemo(
    () => all.filter((n) => !readIds.has(n.id)),
    [all, readIds],
  )

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds(() => {
      const next = new Set(all.map((n) => n.id))
      saveReadIds(next)
      return next
    })
  }, [all])

  const isRead = useCallback((id: string) => readIds.has(id), [readIds])

  useEffect(() => {
    const high = unread.filter((n) => n.priority === 'high')
    if (high.length > 0 && !toastedHigh) {
      setToastedHigh(true)
      toast.warning(
        high.length === 1
          ? high[0].title
          : `${high.length} alertes urgentes (abonnement / essai)`,
        { description: 'Consultez les notifications.', duration: 8000 },
      )
    }
  }, [unread, toastedHigh])

  const value = useMemo(
    () => ({
      all,
      unread,
      unreadCount: unread.length,
      markRead,
      markAllRead,
      isRead,
    }),
    [all, unread, markRead, markAllRead, isRead],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
