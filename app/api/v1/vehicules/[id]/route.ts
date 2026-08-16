import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { toVehiculeDto } from "@/lib/api/mappers-vehicule"
import { prisma } from "@/lib/prisma"
import type { VehicleType } from "@prisma/client"

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
    const existing = await prisma.vehicule.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Véhicule introuvable.")

    const body = await request.json()
    const vehicule = await prisma.vehicule.update({
      where: { id },
      data: {
        type: (body.type as VehicleType) ?? existing.type,
        marque: body.marque ? String(body.marque).trim() : existing.marque,
        modele: body.modele ? String(body.modele).trim() : existing.modele,
        matricule:
          body.matricule !== undefined
            ? body.matricule
              ? String(body.matricule).trim()
              : null
            : existing.matricule,
        assuranceExpiration:
          body.assuranceExpiration !== undefined
            ? body.assuranceExpiration
              ? new Date(String(body.assuranceExpiration))
              : null
            : existing.assuranceExpiration,
        controleTechniqueExpiration:
          body.controleTechniqueExpiration !== undefined
            ? body.controleTechniqueExpiration
              ? new Date(String(body.controleTechniqueExpiration))
              : null
            : existing.controleTechniqueExpiration,
      },
    })

    const dto = toVehiculeDto(vehicule)
    if (!dto) throw new ApiError(500, "Données véhicule invalides.")
    return jsonWithCors({ vehicule: dto }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const existing = await prisma.vehicule.findFirst({
      where: { id, autoEcoleId: tenant.autoEcoleId },
    })
    if (!existing) throw new ApiError(404, "Véhicule introuvable.")

    await prisma.vehicule.delete({ where: { id } })
    return jsonWithCors({ ok: true }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
