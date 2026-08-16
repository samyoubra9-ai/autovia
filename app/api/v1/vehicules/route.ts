import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { toVehiculeDto } from "@/lib/api/mappers-vehicule"
import { safeMapSync } from "@/lib/api/safe"
import { prisma } from "@/lib/prisma"
import type { VehicleType } from "@prisma/client"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const vehicules = await prisma.vehicule.findMany({
      where: { autoEcoleId: tenant.autoEcoleId },
      orderBy: { createdAt: "desc" },
    })
    return jsonWithCors(
      { vehicules: safeMapSync(vehicules, (v) => toVehiculeDto(v), "vehicule") },
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
    const body = await request.json()
    const marque = String(body.marque ?? "").trim()
    const modele = String(body.modele ?? "").trim()
    const type = body.type as VehicleType

    if (!marque || !modele || !type) {
      throw new ApiError(400, "Type, marque et modèle requis.")
    }

    const vehicule = await prisma.vehicule.create({
      data: {
        autoEcoleId: tenant.autoEcoleId,
        type,
        marque,
        modele,
        matricule: body.matricule ? String(body.matricule).trim() : null,
        assuranceExpiration: body.assuranceExpiration
          ? new Date(String(body.assuranceExpiration))
          : null,
        controleTechniqueExpiration: body.controleTechniqueExpiration
          ? new Date(String(body.controleTechniqueExpiration))
          : null,
      },
    })

    const dto = toVehiculeDto(vehicule)
    if (!dto) throw new ApiError(500, "Erreur lors de la création du véhicule.")
    return jsonWithCors({ vehicule: dto }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
