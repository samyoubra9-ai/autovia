import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { searchParams } = new URL(request.url)
    const nin = searchParams.get("nin")?.trim()
    const telephone = searchParams.get("telephone")?.trim()
    const excludeId = searchParams.get("excludeId")?.trim()

    const conflicts: { field: string; message: string; eleve?: { id: string; prenom: string; nom: string; identifiant: string } }[] = []

    if (nin) {
      const ninDigits = nin.replace(/\D/g, "")
      if (ninDigits.length === 18) {
        const existing = await prisma.eleve.findFirst({
          where: {
            autoEcoleId: tenant.autoEcoleId,
            nin: ninDigits,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
          select: { id: true, prenom: true, nom: true, identifiant: true },
        })
        if (existing) {
          conflicts.push({
            field: "nin",
            message: `Ce N.I.N est déjà utilisé par ${existing.prenom} ${existing.nom} (${existing.identifiant}).`,
            eleve: existing,
          })
        }
      }
    }

    if (telephone) {
      const telDigits = telephone.replace(/\D/g, "")
      if (telDigits.length >= 9) {
        const existing = await prisma.eleve.findFirst({
          where: {
            autoEcoleId: tenant.autoEcoleId,
            telephone,
            ...(excludeId ? { id: { not: excludeId } } : {}),
          },
          select: { id: true, prenom: true, nom: true, identifiant: true },
        })
        if (existing) {
          conflicts.push({
            field: "telephone",
            message: `Ce numéro est déjà enregistré pour ${existing.prenom} ${existing.nom} (${existing.identifiant}).`,
            eleve: existing,
          })
        }
      }
    }

    return jsonWithCors({ available: conflicts.length === 0, conflicts }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
