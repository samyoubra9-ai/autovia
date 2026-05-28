import { supabase } from '@/lib/supabase'
import { getPlatformAdminOAuthRedirectUrl } from '@/lib/oauth-redirect'
import { formatClientError, isNetworkError } from '@/lib/safe'
import { isSupabaseConfigured } from '@/lib/env'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

export type AuthStatusResponse =
  | { role: 'site_admin'; email: string; hasTenant: false; hasAccess: true }
  | { role: 'pending_onboarding'; email: string; hasTenant: false; hasAccess: false }
  | {
      role: 'auto_ecole'
      email: string
      hasTenant: true
      hasAccess: boolean
    }

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase non configuré (.env manquant).')
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Session expirée. Reconnectez-vous.')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })

    const payload = (await res.json().catch(() => ({}))) as {
      error?: string
      detail?: string
    }

    if (!res.ok) {
      const base = payload.error ?? 'Erreur serveur.'
      const message = payload.detail?.trim()
        ? `${base} — ${payload.detail.trim()}`
        : base
      throw new Error(message)
    }

    return payload as T
  } catch (e) {
    if (isNetworkError(e)) {
      throw new Error(
        'Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.',
      )
    }
    throw new Error(formatClientError(e, 'Erreur réseau.'))
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  return authFetch<AuthStatusResponse>('/api/v1/auth/status')
}

export function getOAuthRedirectUrl(): string {
  return getPlatformAdminOAuthRedirectUrl()
}
