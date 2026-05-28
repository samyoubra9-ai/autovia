import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getBackdashUrl } from '@/lib/app-urls'
import { getConfigError } from '@/lib/env'
import { fetchAuthStatus } from '@/lib/auth-api'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finalisation de la connexion…')

  useEffect(() => {
    const configError = getConfigError()
    if (configError || !supabase) {
      setMessage(configError ?? 'Supabase non configuré.')
      return
    }

    let cancelled = false

    async function run() {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (!cancelled) setMessage(error.message)
          return
        }
        window.history.replaceState({}, '', '/auth/callback')
      } else {
        const hash = window.location.hash.replace(/^#/, '')
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) {
            if (!cancelled) setMessage(error.message)
            return
          }
          window.history.replaceState({}, '', '/auth/callback')
        }
      }

      const { data, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr || !data.session) {
        if (!cancelled) {
          setMessage('Session introuvable.')
          setTimeout(() => void navigate('/sign-in', { replace: true }), 2000)
        }
        return
      }

      try {
        const status = await fetchAuthStatus()
        if (cancelled) return
        if (status.role !== 'site_admin') {
          await supabase.auth.signOut()
          if (status.role === 'auto_ecole') {
            window.location.href = getBackdashUrl()
            return
          }
          void navigate('/sign-in', { replace: true })
          return
        }
        void navigate('/', { replace: true })
      } catch (e) {
        if (!cancelled) {
          setMessage(e instanceof Error ? e.message : 'Erreur de connexion.')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="sign-in-shell">
      <p>{message}</p>
    </div>
  )
}
