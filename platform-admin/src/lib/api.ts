import { getApiBaseUrl } from '@/lib/app-urls'
import { supabase } from '@/lib/supabase'
import { formatClientError, isNetworkError } from '@/lib/safe'
import type {
  SiteAdminAutoEcoleRow,
  SiteAdminDashboardStats,
  SiteAdminListResponse,
} from '@/types/admin'

export type { SiteAdminAutoEcoleRow, SiteAdminDashboardStats, SiteAdminListResponse }

const API_BASE = getApiBaseUrl()

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new ApiClientError('Supabase non configuré (.env).', 500)
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ApiClientError('Session expirée. Reconnectez-vous.', 401)
  return token
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
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
      throw new ApiClientError(message, res.status)
    }

    return payload as T
  } catch (e) {
    if (e instanceof ApiClientError) throw e
    if (isNetworkError(e)) {
      throw new ApiClientError(
        'Impossible de contacter le serveur. Réessayez plus tard.',
        0,
      )
    }
    throw new ApiClientError(formatClientError(e, 'Erreur réseau.'), 0)
  } finally {
    clearTimeout(timeout)
  }
}

export const api = {
  listAdminAutoEcoles: () =>
    apiFetch<SiteAdminListResponse>('/api/v1/admin/auto-ecoles'),
  createAdminAutoEcole: (body: Record<string, unknown>) =>
    apiFetch<{ autoEcole: SiteAdminAutoEcoleRow; message: string }>(
      '/api/v1/admin/auto-ecoles',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateAdminAutoEcoleAccess: (
    id: string,
    body: {
      action?: import('@/types/admin').SiteAdminAccessAction
      subscriptionStatus?: string
      extendTrialDays?: number
      paidUntil?: string | null
      adminNotes?: string
    },
  ) =>
    apiFetch<{ autoEcole: SiteAdminAutoEcoleRow; message: string }>(
      `/api/v1/admin/auto-ecoles/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
}
