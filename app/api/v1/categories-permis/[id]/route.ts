import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { parseCategoriePermisInput, toCategoriePermisDto } from "@/lib/api/categories-permis"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function PATCH(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.categoriePermisEcole.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Catégorie introuvable.")

    const input = parseCategoriePermisInput(await request.json())
    if (input.code !== existing.code) {
      const duplicate = await prisma.categoriePermisEcole.findFirst({
        where: {
          autoEcoleId: tenant.autoEcoleId,
          code: input.code,
          id: { not: id },
        },
      })
      if (duplicate) {
        throw new ApiError(409, `La catégorie « ${input.code} » existe déjà.`)
      }
    }

    const row = await prisma.categoriePermisEcole.update({
      where: { id },
      data: input,
    })

    return jsonWithCors({ categorie: toCategoriePermisDto(row) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.categoriePermisEcole.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Catégorie introuvable.")

    const [usedEleves, usedListes] = await Promise.all([
      prisma.eleve.count({
        where: { autoEcoleId: tenant.autoEcoleId, categoriePermisId: id },
      }),
      prisma.listeExamenCandidat.count({
        where: { categoriePermisId: id },
      }),
    ])
    if (usedEleves > 0 || usedListes > 0) {
      throw new ApiError(
        409,
        `Impossible de supprimer : catégorie utilisée par ${usedEleves} élève(s) et ${usedListes} entrée(s) de liste. Désactivez-la plutôt.`,
      )
    }

    await prisma.categoriePermisEcole.delete({ where: { id } })
    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
