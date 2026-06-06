"use server"

import { revalidatePath } from "next/cache"

import { getTrialEndsAt, slugifyAutoEcole } from "@/lib/auth-utils"
import {
  applySiteAdminAccessUpdate,
  resolveSiteAdminAccessAction,
  type SiteAdminAccessPatchBody,
} from "@/lib/api/site-admin-access-update"
import {
  buildBillingRecordFromAccessPatch,
  createSubscriptionBillingRecord,
  shouldRecordBillingOnAccessAction,
} from "@/lib/api/subscription-billing"
import { requireSiteAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SubscriptionStatus } from "@prisma/client"

export type AdminActionResult = { error?: string; success?: string }

export async function createAutoEcoleAccount(input: {
  nomAutoEcole: string
  ville?: string
  telephone?: string
  email: string
  password: string
  prenom: string
  nom: string
  adminNotes?: string
}): Promise<AdminActionResult> {
  await requireSiteAdmin()

  const nomAutoEcole = input.nomAutoEcole.trim()
  const email = input.email.trim().toLowerCase()
  const prenom = input.prenom.trim()
  const nom = input.nom.trim()

  if (!nomAutoEcole || !email || !prenom || !nom) {
    return { error: "Remplissez tous les champs obligatoires." }
  }

  if (input.password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." }
  }

  const existingUser = await prisma.user.findFirst({ where: { email } })
  if (existingUser) {
    return { error: "Cet e-mail est déjà utilisé par une auto-école." }
  }

  const supabaseAdmin = createAdminClient()
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { prenom, nom, nom_auto_ecole: nomAutoEcole },
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Impossible de créer le compte Supabase." }
  }

  let slug = slugifyAutoEcole(nomAutoEcole)
  let attempts = 0
  while (await prisma.autoEcole.findUnique({ where: { slug } })) {
    slug = slugifyAutoEcole(nomAutoEcole)
    attempts++
    if (attempts > 5) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: "Impossible de générer un identifiant unique." }
    }
  }

  try {
    await prisma.autoEcole.create({
      data: {
        nom: nomAutoEcole,
        slug,
        ville: input.ville?.trim() || null,
        telephone: input.telephone?.trim() || null,
        emailContact: email,
        trialEndsAt: getTrialEndsAt(),
        subscriptionStatus: "EXPIRED",
        adminNotes: input.adminNotes?.trim() || null,
        users: {
          create: {
            supabaseUserId: authData.user.id,
            email,
            prenom,
            nom,
            role: "OWNER",
          },
        },
      },
    })
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return { error: "Erreur lors de l'enregistrement en base. Vérifiez que les migrations SQL sont appliquées." }
  }

  revalidatePath("/admin")
  return { success: `Auto-école « ${nomAutoEcole} » créée. Accès bloqué jusqu'à activation.` }
}

export async function updateAutoEcoleAccess(
  input: {
    autoEcoleId: string
    adminNotes?: string
  } & SiteAdminAccessPatchBody,
): Promise<AdminActionResult> {
  await requireSiteAdmin()

  const autoEcole = await prisma.autoEcole.findUnique({
    where: { id: input.autoEcoleId },
  })

  if (!autoEcole) {
    return { error: "Auto-école introuvable." }
  }

  try {
    const patch = applySiteAdminAccessUpdate(autoEcole, input)
    const action = input.action ?? resolveSiteAdminAccessAction(autoEcole, input)

    await prisma.$transaction(async (tx) => {
      await tx.autoEcole.update({
        where: { id: input.autoEcoleId },
        data: {
          subscriptionStatus: patch.subscriptionStatus,
          subscriptionPlan: patch.subscriptionPlan,
          trialEndsAt: patch.trialEndsAt,
          paidUntil: patch.paidUntil,
          ...(input.adminNotes !== undefined
            ? { adminNotes: input.adminNotes.trim() || null }
            : {}),
        },
      })

      const billingDraft = buildBillingRecordFromAccessPatch(action, input, patch)
      if (billingDraft && shouldRecordBillingOnAccessAction(action, input.recordBilling)) {
        const { siteAdmin } = await requireSiteAdmin()
        await createSubscriptionBillingRecord(tx, {
          ...billingDraft,
          autoEcoleId: input.autoEcoleId,
          siteAdminId: siteAdmin.id,
        })
      }
    })

    revalidatePath("/admin")
    return { success: patch.message }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Action invalide." }
  }
}
