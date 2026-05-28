import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiClientError } from '@/lib/api'
import type { SiteAdminAutoEcoleRow, SiteAdminDashboardStats } from '@/types/admin'
import { buildAdminNotifications } from '@/lib/admin-notifications'

const emptyStats: SiteAdminDashboardStats = {
  total: 0,
  active: 0,
  blocked: 0,
  trial: 0,
  expired: 0,
  cancelled: 0,
  newLast7Days: 0,
  newLast30Days: 0,
}

type ClientsContextValue = {
  rows: SiteAdminAutoEcoleRow[]
  stats: SiteAdminDashboardStats
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateRow: (row: SiteAdminAutoEcoleRow) => void
}

const ClientsContext = createContext<ClientsContextValue | null>(null)

const POLL_MS = 5 * 60 * 1000

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<SiteAdminAutoEcoleRow[]>([])
  const [stats, setStats] = useState<SiteAdminDashboardStats>(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const data = await api.listAdminAutoEcoles()
      setRows(data.autoEcoles)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  const updateRow = useCallback((row: SiteAdminAutoEcoleRow) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))
  }, [])

  const value = useMemo(
    () => ({ rows, stats, loading, error, refresh, updateRow }),
    [rows, stats, loading, error, refresh, updateRow],
  )

  return <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
}

export function useClients() {
  const ctx = useContext(ClientsContext)
  if (!ctx) throw new Error('useClients must be used within ClientsProvider')
  return ctx
}

/** Notifications dérivées des clients (essai / abonnement / nouveaux). */
export function useDerivedNotifications() {
  const { rows } = useClients()
  return useMemo(() => buildAdminNotifications(rows), [rows])
}
