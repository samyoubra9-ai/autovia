import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { toPaiementDto } from "@/lib/api/mappers"
import { safeMapSync } from "@/lib/api/safe"
import { notifyBackdashPaiement } from "@/lib/push/backdash-events"
import { notifyCandidatPaiement } from "@/lib/push/candidat-events"
import { assertCanAddPaiementOnPlan } from "@/lib/api/trial-plan-context"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const url = new URL(request.url)
    const eleveId = url.searchParams.get("eleveId")?.trim() || undefined
    const paiements = await prisma.paiement.findMany({
      where: {
        autoEcoleId: tenant.autoEcoleId,
        ...(eleveId ? { eleveId } : {}),
      },
      orderBy: { createdAt: "desc" },
    })
    return jsonWithCors({ paiements: paiements.map(toPaiementDto) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function POST(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = await request.json()
    const eleveId = String(body.eleveId ?? "")
    const montant = Number(body.montant)
    const moniteurNom = String(body.moniteurNom ?? "").trim()

    if (!eleveId || !montant || !moniteurNom) {
      throw new ApiError(400, "Élève, montant et moniteur requis.")
    }

    const autoEcole = await prisma.autoEcole.findUniqueOrThrow({
      where: { id: tenant.autoEcoleId },
      select: { subscriptionStatus: true },
    })
    await assertCanAddPaiementOnPlan(
      prisma,
      tenant.autoEcoleId,
      autoEcole.subscriptionStatus,
    )

    const eleve = await prisma.eleve.findFirst({
      where: { id: eleveId, autoEcoleId: tenant.autoEcoleId },
    })
    if (!eleve) throw new ApiError(404, "Élève introuvable.")

    const paiementsEleve = await prisma.paiement.findMany({
      where: { eleveId, autoEcoleId: tenant.autoEcoleId },
    })
    const totalPaye = paiementsEleve.reduce((s, p) => s + p.montant, 0)
    const reste = eleve.prixPermis - totalPaye

    if (montant <= 0) throw new ApiError(400, "Montant invalide.")
    if (montant > reste) {
      throw new ApiError(
        400,
        `Le montant dépasse le reste à payer (${reste.toLocaleString("fr-DZ")} DZD).`,
      )
    }

    const paiement = await prisma.paiement.create({
      data: {
        autoEcoleId: tenant.autoEcoleId,
        eleveId,
        montant,
        moniteurNom,
        enregistreParId: tenant.userId,
      },
    })

    const dto = toPaiementDto(paiement)
    if (!dto) throw new ApiError(500, "Erreur lors de l'enregistrement du paiement.")

    notifyCandidatPaiement({
      eleveId,
      montant,
      resteAPayer: Math.max(0, eleve.prixPermis - totalPaye - montant),
    })
    notifyBackdashPaiement({
      autoEcoleId: tenant.autoEcoleId,
      eleveId,
      montant,
    })

    return jsonWithCors({ paiement: dto }, origin, { status: 201 })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
