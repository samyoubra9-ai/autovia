"use server"

import { redirect } from "next/navigation"

import { getBackdashUrl, getTrialEndsAt, slugifyAutoEcole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import {
  initialSubscriptionStatusForRegistration,
  initialVerificationStatusForRegistration,
} from "@/lib/verification/bypass"

export type AuthResult = { error?: string; success?: boolean }

/** Crée le profil admin plateforme (une seule fois, page /setup-admin). */
export async function createSiteAdminProfile(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: "Session invalide. Reconnectez-vous." }
  }

  const adminCount = await prisma.siteAdmin.count()
  if (adminCount > 0) {
    return { error: "Un administrateur existe déjà. Supprimez la page /setup-admin." }
  }

  const existing = await prisma.siteAdmin.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (existing) {
    redirect("/admin/apprentissage")
  }

  await prisma.siteAdmin.create({
    data: {
      supabaseUserId: user.id,
      email: user.email,
    },
  })

  redirect("/admin/apprentissage")
}

/** Réservé à la création d'auto-écoles par l'admin plateforme (à venir). */
export async function registerTenant(input: {
  nomAutoEcole: string
  ville?: string
  telephone?: string
  prenom: string
  nom: string
}): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { error: "Session invalide. Reconnectez-vous ou confirmez votre e-mail." }
  }

  const existing = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (existing) {
    redirect(getBackdashUrl())
  }

  const nomAutoEcole = input.nomAutoEcole.trim()
  if (!nomAutoEcole || !input.prenom.trim() || !input.nom.trim()) {
    return { error: "Tous les champs obligatoires doivent être remplis." }
  }

  let slug = slugifyAutoEcole(nomAutoEcole)
  let attempts = 0
  while (await prisma.autoEcole.findUnique({ where: { slug } })) {
    slug = slugifyAutoEcole(nomAutoEcole)
    attempts++
    if (attempts > 5) {
      return { error: "Impossible de créer l'espace. Réessayez." }
    }
  }

  const trialEndsAt = getTrialEndsAt()

  await prisma.autoEcole.create({
    data: {
      nom: nomAutoEcole,
      slug,
      ville: input.ville?.trim() || null,
      telephone: input.telephone?.trim() || null,
      emailContact: user.email,
      trialEndsAt,
      subscriptionStatus: initialSubscriptionStatusForRegistration(),
      verificationStatus: initialVerificationStatusForRegistration(),
      users: {
        create: {
          supabaseUserId: user.id,
          email: user.email,
          prenom: input.prenom.trim(),
          nom: input.nom.trim(),
          role: "OWNER",
        },
      },
    },
  })

  redirect(getBackdashUrl())
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/signin")
}
