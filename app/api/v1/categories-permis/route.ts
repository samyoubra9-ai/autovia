import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  ensureDefaultCategoriesPermis,
  parseCategoriePermisInput,
  toCategoriePermisDto,
} from "@/lib/api/categories-permis"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const rows = await ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId)
    return jsonWithCors(
      { categories: rows.map(toCategoriePermisDto) },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const input = parseCategoriePermisInput(await request.json())

    const duplicate = await prisma.categoriePermisEcole.findFirst({
      where: { autoEcoleId: tenant.autoEcoleId, code: input.code },
    })
    if (duplicate) {
      throw new ApiError(409, `La catégorie « ${input.code} » existe déjà.`)
    }

    const row = await prisma.categoriePermisEcole.create({
      data: {
        autoEcoleId: tenant.autoEcoleId,
        ...input,
      },
    })

    return jsonWithCors({ categorie: toCategoriePermisDto(row) }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
