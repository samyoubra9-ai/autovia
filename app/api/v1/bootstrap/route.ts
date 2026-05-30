import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis, toCategoriePermisDto } from "@/lib/api/categories-permis"
import { toAutoEcolePrintSettings } from "@/lib/api/auto-ecole-print"
import { toListeExamenSettings } from "@/lib/api/liste-examen-settings"
import { toEleveDto, toPaiementDto } from "@/lib/api/mappers"
import { toMoniteurDto, toVehiculeDto } from "@/lib/api/mappers-vehicule"
import { safeLoad, safeMapSync } from "@/lib/api/safe"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)

    const autoEcoleId = tenant.autoEcoleId

    const autoEcoleRow = await prisma.autoEcole.findUnique({
      where: { id: autoEcoleId },
    })

    const [categoriesPermis, eleves, paiements, vehicules, moniteurs] = await Promise.all([
      safeLoad(
        "categoriesPermis",
        () => ensureDefaultCategoriesPermis(prisma, autoEcoleId),
        [],
      ),
      prisma.eleve.findMany({
        where: { autoEcoleId },
        orderBy: { createdAt: "desc" },
        include: { categoriePermis: true, moniteur: true, vehicule: true },
      }),
      safeLoad(
        "paiements",
        () =>
          prisma.paiement.findMany({
            where: { autoEcoleId },
            orderBy: { createdAt: "asc" },
          }),
        [],
      ),
      safeLoad(
        "vehicules",
        () =>
          prisma.vehicule.findMany({
            where: { autoEcoleId },
            orderBy: { createdAt: "desc" },
          }),
        [],
      ),
      safeLoad(
        "moniteurs",
        () =>
          prisma.moniteur.findMany({
            where: { autoEcoleId },
            orderBy: { createdAt: "desc" },
            include: { categoriePermis: true },
          }),
        [],
      ),
    ])

    return jsonWithCors(
      {
        autoEcole: {
          id: tenant.autoEcole.id,
          nom: tenant.autoEcole.nom,
          slug: tenant.autoEcole.slug,
          printSettings: autoEcoleRow
            ? toAutoEcolePrintSettings(autoEcoleRow)
            : null,
          listeSettings: autoEcoleRow
            ? toListeExamenSettings(autoEcoleRow)
            : null,
        },
        categoriesPermis: categoriesPermis.map(toCategoriePermisDto),
        eleves: safeMapSync(eleves, (e) => {
          try {
            return toEleveDto(e)
          } catch (err) {
            console.warn("[bootstrap] eleve skip", e.id, err)
            return null
          }
        }, "eleve"),
        paiements: safeMapSync(paiements, (p) => {
          try {
            return toPaiementDto(p)
          } catch {
            return null
          }
        }, "paiement"),
        vehicules: safeMapSync(vehicules, (v) => {
          try {
            return toVehiculeDto(v)
          } catch {
            return null
          }
        }, "vehicule"),
        moniteurs: safeMapSync(moniteurs, (m) => {
          try {
            return toMoniteurDto(m)
          } catch {
            return null
          }
        }, "moniteur"),
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
