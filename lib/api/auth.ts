import { createClient } from "@supabase/supabase-js"

import { ApiError } from "@/lib/api/errors"
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/api/network"
import { hasAutoEcoleAccess } from "@/lib/access"
import { prisma } from "@/lib/prisma"

export type TenantContext = {
  supabaseUserId: string
  userId: string
  autoEcoleId: string
  email: string
  prenom: string
  nom: string
  autoEcole: {
    id: string
    nom: string
    slug: string
    subscriptionStatus: string
    trialEndsAt: Date
    paidUntil: Date | null
  }
}

export type AuthUser = {
  id: string
  email: string
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return null
  return header.slice(7).trim() || null
}

export async function requireAuthUser(request: Request): Promise<AuthUser> {
  const token = getBearerToken(request)
  if (!token) {
    throw new ApiError(401, "Authentification requise.")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new ApiError(500, "Configuration Supabase manquante.")
  }

  const supabase = createClient(url, anonKey)

  let user: { id: string; email?: string } | null = null
  let authError: unknown = null

  try {
    const result = await supabase.auth.getUser(token)
    user = result.data.user
    authError = result.error
  } catch (error) {
    if (isNetworkError(error)) {
      throw new ApiError(503, NETWORK_ERROR_MESSAGE, "NETWORK_ERROR")
    }
    throw error
  }

  if (authError) {
    if (isNetworkError(authError)) {
      throw new ApiError(503, NETWORK_ERROR_MESSAGE, "NETWORK_ERROR")
    }
    throw new ApiError(401, "Session invalide ou expirée.", "AUTH_INVALID")
  }

  if (!user?.email) {
    throw new ApiError(401, "Session invalide ou expirée.", "AUTH_INVALID")
  }

  return { id: user.id, email: user.email }
}

export async function requireTenant(request: Request): Promise<TenantContext> {
  const authUser = await requireAuthUser(request)

  const tenant = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    include: { autoEcole: true },
  })

  if (!tenant) {
    throw new ApiError(403, "Compte auto-école introuvable.")
  }

  if (!hasAutoEcoleAccess(tenant.autoEcole)) {
    throw new ApiError(403, "Accès bloqué ou expiré. Contactez Autovia.")
  }

  return {
    supabaseUserId: authUser.id,
    userId: tenant.id,
    autoEcoleId: tenant.autoEcoleId,
    email: tenant.email,
    prenom: tenant.prenom,
    nom: tenant.nom,
    autoEcole: {
      id: tenant.autoEcole.id,
      nom: tenant.autoEcole.nom,
      slug: tenant.autoEcole.slug,
      subscriptionStatus: tenant.autoEcole.subscriptionStatus,
      trialEndsAt: tenant.autoEcole.trialEndsAt,
      paidUntil: tenant.autoEcole.paidUntil,
    },
  }
}

export async function generateEleveIdentifiant(autoEcoleId: string): Promise<string> {
  const count = await prisma.eleve.count({ where: { autoEcoleId } })
  const year = new Date().getFullYear()
  return `ELV-${year}-${String(count + 1).padStart(4, "0")}`
}
