import { createClient } from "@supabase/supabase-js"

import { ApiError } from "@/lib/api/errors"
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/api/network"
import { hasAutoEcoleAccess } from "@/lib/access"
import { prisma } from "@/lib/prisma"
import { syncAutoEcoleWhenVerificationDisabled } from "@/lib/verification/bypass"

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
    ville: string | null
    telephone: string | null
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

export async function requireTenantMembership(request: Request): Promise<TenantContext> {
  const authUser = await requireAuthUser(request)

  const tenant = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    include: { autoEcole: true },
  })

  if (!tenant) {
    throw new ApiError(403, "Compte auto-école introuvable.")
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
      ville: tenant.autoEcole.ville,
      telephone: tenant.autoEcole.telephone,
      subscriptionStatus: tenant.autoEcole.subscriptionStatus,
      trialEndsAt: tenant.autoEcole.trialEndsAt,
      paidUntil: tenant.autoEcole.paidUntil,
    },
  }
}

export async function requireTenant(request: Request): Promise<TenantContext> {
  const tenant = await requireTenantMembership(request)

  let full = await prisma.autoEcole.findUniqueOrThrow({
    where: { id: tenant.autoEcoleId },
  })

  const synced = await syncAutoEcoleWhenVerificationDisabled(prisma, full.id)
  if (synced) full = synced

  if (!hasAutoEcoleAccess(full)) {
    throw new ApiError(403, "Accès bloqué ou expiré. Contactez Autovia.")
  }

  return tenant
}

const ELEVE_IDENTIFIANT_RE = /^ELV-(\d{4})-(\d+)$/

export async function generateEleveIdentifiant(autoEcoleId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ELV-${year}-`

  const rows = await prisma.eleve.findMany({
    where: {
      autoEcoleId,
      identifiant: { startsWith: prefix },
    },
    select: { identifiant: true },
  })

  let maxSeq = 0
  for (const row of rows) {
    const match = row.identifiant.match(ELEVE_IDENTIFIANT_RE)
    if (match && Number(match[1]) === year) {
      maxSeq = Math.max(maxSeq, Number.parseInt(match[2], 10))
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`
}
