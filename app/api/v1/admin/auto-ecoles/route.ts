import { getTrialEndsAt, slugifyAutoEcole } from "@/lib/auth-utils"
import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import { buildSiteAdminStats, siteAdminAutoEcoleInclude, toSiteAdminAutoEcoleDto } from "@/lib/api/site-admin-dto"
import { prisma } from "@/lib/prisma"
import { createAdminClient } from "@/lib/supabase/admin"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)

    const autoEcoles = await prisma.autoEcole.findMany({
      orderBy: { createdAt: "desc" },
      include: siteAdminAutoEcoleInclude,
    })

    const rows = autoEcoles.map((ae) => toSiteAdminAutoEcoleDto(ae))

    return jsonWithCors(
      {
        autoEcoles: rows,
        stats: buildSiteAdminStats(rows),
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireSiteAdminApi(request)
    const body = await request.json()

    const nomAutoEcole = String(body.nomAutoEcole ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const prenom = String(body.prenom ?? "").trim()
    const nom = String(body.nom ?? "").trim()
    const password = String(body.password ?? "")

    if (!nomAutoEcole || !email || !prenom || !nom) {
      throw new ApiError(400, "Remplissez tous les champs obligatoires.")
    }
    if (password.length < 8) {
      throw new ApiError(400, "Le mot de passe doit contenir au moins 8 caractères.")
    }

    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) {
      throw new ApiError(409, "Cet e-mail est déjà utilisé par une auto-école.")
    }

    const supabaseAdmin = createAdminClient()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { prenom, nom, nom_auto_ecole: nomAutoEcole },
    })

    if (authError || !authData.user) {
      throw new ApiError(500, authError?.message ?? "Impossible de créer le compte Supabase.")
    }

    let slug = slugifyAutoEcole(nomAutoEcole)
    let attempts = 0
    while (await prisma.autoEcole.findUnique({ where: { slug } })) {
      slug = slugifyAutoEcole(nomAutoEcole)
      attempts++
      if (attempts > 5) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new ApiError(500, "Impossible de générer un identifiant unique.")
      }
    }

    try {
      const created = await prisma.autoEcole.create({
        data: {
          nom: nomAutoEcole,
          slug,
          ville: body.ville ? String(body.ville).trim() || null : null,
          telephone: body.telephone ? String(body.telephone).trim() || null : null,
          emailContact: email,
          trialEndsAt: getTrialEndsAt(),
          subscriptionStatus: "TRIAL",
          verificationStatus: "APPROVED",
          adminNotes: body.adminNotes ? String(body.adminNotes).trim() || null : null,
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
        include: siteAdminAutoEcoleInclude,
      })

      return jsonWithCors(
        {
          autoEcole: toSiteAdminAutoEcoleDto(created),
          message: `Auto-école « ${nomAutoEcole} » créée. Accès bloqué jusqu'à activation.`,
        },
        origin,
        { status: 201 },
      )
    } catch {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new ApiError(
        500,
        "Erreur lors de l'enregistrement en base. Vérifiez que les migrations SQL sont appliquées.",
      )
    }
  } catch (error) {
    return handleApiError(error, origin)
  }
}
