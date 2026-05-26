import { ApiError } from "@/lib/api/errors"
import {
  parseAutoEcolePrintInput,
  printSettingsToPrismaUpdate,
} from "@/lib/api/auto-ecole-print"
import {
  listeSettingsToPrismaUpdate,
  parseListeExamenSettingsInput,
} from "@/lib/api/liste-examen-settings"
import {
  createCategoriesPermisForAutoEcole,
  parseOnboardingCategoriesInput,
  type OnboardingCategorieInput,
} from "@/lib/api/categories-permis"
import { getTrialEndsAt, slugifyAutoEcole } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

export type OnboardingRegisterInput = {
  nomAutoEcole: string
  prenom: string
  nom: string
  ville?: string | null
  telephone?: string | null
  printSettings?: unknown
  listeSettings?: unknown
  categoriesPermis: OnboardingCategorieInput[]
}

export function parseOnboardingRegisterInput(body: unknown): OnboardingRegisterInput {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Corps invalide.")
  }
  const b = body as Record<string, unknown>
  const nomAutoEcole = String(b.nomAutoEcole ?? "").trim()
  const prenom = String(b.prenom ?? "").trim()
  const nom = String(b.nom ?? "").trim()

  if (!nomAutoEcole || !prenom || !nom) {
    throw new ApiError(400, "Nom de l'auto-école, prénom et nom sont obligatoires.")
  }

  if (nomAutoEcole.length < 2) {
    throw new ApiError(400, "Nom de l'auto-école trop court.")
  }

  return {
    nomAutoEcole,
    prenom,
    nom,
    ville: b.ville != null ? String(b.ville).trim() || null : undefined,
    telephone: b.telephone != null ? String(b.telephone).trim() || null : undefined,
    printSettings: b.printSettings,
    listeSettings: b.listeSettings,
    categoriesPermis: parseOnboardingCategoriesInput(b.categoriesPermis),
  }
}

export async function registerAutoEcoleTenant(
  supabaseUserId: string,
  email: string,
  input: OnboardingRegisterInput,
) {
  const existing = await prisma.user.findUnique({
    where: { supabaseUserId },
  })
  if (existing) {
    throw new ApiError(409, "Un espace auto-école existe déjà pour ce compte.", "TENANT_EXISTS")
  }

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { supabaseUserId },
  })
  if (siteAdmin) {
    throw new ApiError(403, "Ce compte est administrateur plateforme, pas une auto-école.")
  }

  let slug = slugifyAutoEcole(input.nomAutoEcole)
  let attempts = 0
  while (await prisma.autoEcole.findUnique({ where: { slug } })) {
    slug = slugifyAutoEcole(input.nomAutoEcole)
    attempts++
    if (attempts > 5) {
      throw new ApiError(500, "Impossible de générer un identifiant unique.")
    }
  }

  const printInput = input.printSettings
    ? parseAutoEcolePrintInput(input.printSettings)
    : {}
  const listeInput = input.listeSettings
    ? parseListeExamenSettingsInput(input.listeSettings)
    : {}

  const ville = input.ville ?? printInput.ville ?? null
  const telephone = input.telephone ?? printInput.telephone ?? null

  const trialEndsAt = getTrialEndsAt()

  const autoEcole = await prisma.$transaction(async (tx) => {
    const created = await tx.autoEcole.create({
      data: {
        nom: input.nomAutoEcole,
        slug,
        emailContact: email,
        trialEndsAt,
        subscriptionStatus: "TRIAL",
        ...printSettingsToPrismaUpdate({
          ...printInput,
          ville,
          telephone,
        }),
        ...listeSettingsToPrismaUpdate(listeInput),
        users: {
          create: {
            supabaseUserId,
            email,
            prenom: input.prenom,
            nom: input.nom,
            role: "OWNER",
          },
        },
      },
      include: { users: true },
    })

    await createCategoriesPermisForAutoEcole(
      tx,
      created.id,
      input.categoriesPermis,
    )

    return created
  })

  const owner = autoEcole.users[0]

  return {
    autoEcole: {
      id: autoEcole.id,
      nom: autoEcole.nom,
      slug: autoEcole.slug,
      subscriptionStatus: autoEcole.subscriptionStatus,
      trialEndsAt: autoEcole.trialEndsAt.toISOString(),
      paidUntil: autoEcole.paidUntil?.toISOString() ?? null,
    },
    user: {
      id: owner.id,
      email: owner.email,
      prenom: owner.prenom,
      nom: owner.nom,
    },
  }
}
