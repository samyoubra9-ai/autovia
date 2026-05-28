import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchAuthStatus } from '@/lib/auth-api'
import { isSupabaseConfigured } from '@/lib/env'

type AuthContextValue = {
  loading: boolean
  session: Session | null
  email: string | null
  isSiteAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isSiteAdmin, setIsSiteAdmin] = useState(false)

  const refreshRole = useCallback(async () => {
    const status = await fetchAuthStatus()
    setEmail(status.email)
    setIsSiteAdmin(status.role === 'site_admin')
    return status.role === 'site_admin'
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    async function init() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) {
          console.warn('[platform-admin] getSession:', error.message)
        }
        setSession(data.session)
        if (data.session) {
          await refreshRole().catch(() => {
            setIsSiteAdmin(false)
          })
        }
      } catch (e) {
        console.error('[platform-admin] init auth:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'TOKEN_REFRESHED') return
      setSession(nextSession)
      if (nextSession) {
        void refreshRole().catch(() => setIsSiteAdmin(false))
      } else {
        setEmail(null)
        setIsSiteAdmin(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshRole])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setEmail(null)
    setIsSiteAdmin(false)
  }, [])

  const value = useMemo(
    () => ({ loading, session, email, isSiteAdmin, signOut }),
    [loading, session, email, isSiteAdmin, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
