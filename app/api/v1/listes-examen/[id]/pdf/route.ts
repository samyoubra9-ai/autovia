import "@sparticuz/chromium-min"
import "puppeteer-core"
import { getAllowedOrigin, corsHeaders } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { ensureDefaultCategoriesPermis } from "@/lib/api/categories-permis"
import { toAutoEcolePrintSettings } from "@/lib/api/auto-ecole-print"
import { toListeExamenDto, listeExamenDtoForPrint } from "@/lib/api/mappers-liste-examen"
import { fillMissingDatesDernierExamenOnListe } from "@/lib/api/liste-examen-date-dernier"
import type { ListeExamenPrintVariant } from "@/lib/api/liste-examen-groups"
import { generateListeExamenPdf } from "@/lib/liste-examen-print/generate-pdf"
import { renderListeExamenPrintHtml } from "@/lib/liste-examen-print/render-html"
import { assertCanPrintOnPlan } from "@/lib/api/trial-plan-context"
import { isTrialPrintBlocked } from "@/lib/plan-limits"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

const candidatInclude = {
  eleve: { include: { categoriePermis: true } },
  categoriePermis: true,
} as const

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
    },
  })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const { id } = await params
    const url = new URL(request.url)
    const format = url.searchParams.get("format") ?? "pdf"
    const variantParam = url.searchParams.get("variant")
    const variant: ListeExamenPrintVariant =
      variantParam === "semi-remorque" ? "semi-remorque" : "principal"

    const [liste, categories, autoEcole] = await Promise.all([
      prisma.listeExamen.findFirst({
        where: { id, autoEcoleId: tenant.autoEcoleId },
        include: {
          candidats: { include: candidatInclude },
          messagesCategorie: { include: { categoriePermis: true } },
        },
      }),
      ensureDefaultCategoriesPermis(prisma, tenant.autoEcoleId),
      prisma.autoEcole.findUnique({ where: { id: tenant.autoEcoleId } }),
    ])

    if (!liste) throw new ApiError(404, "Liste introuvable.")
    if (!autoEcole) throw new ApiError(404, "Auto-école introuvable.")

    const printBlocked = isTrialPrintBlocked(autoEcole.subscriptionStatus)

    await fillMissingDatesDernierExamenOnListe(liste)

    const dto = listeExamenDtoForPrint(toListeExamenDto(liste, categories), variant)
    if (dto.sections.length === 0) {
      throw new ApiError(
        400,
        variant === "semi-remorque"
          ? "Aucun candidat semi-remorque (BE, CE, DE, C1E) sur cette liste."
          : "Aucun candidat pour la liste principale.",
      )
    }
    const printSettings = toAutoEcolePrintSettings(autoEcole)
    const ecoleNomPrint =
      dto.ecoleNomAr?.trim() ||
      printSettings.nomAr?.trim() ||
      printSettings.nom?.trim() ||
      undefined

    const safeDate = dto.dateExamen.replace(/\//g, "-")
    const filename =
      variant === "semi-remorque"
        ? `liste-examen-${safeDate}-semi-remorque.pdf`
        : `liste-examen-${safeDate}.pdf`

    if (format === "html") {
      const html = renderListeExamenPrintHtml(dto, ecoleNomPrint, { printBlocked })
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    assertCanPrintOnPlan(autoEcole.subscriptionStatus)

    const pdf = await generateListeExamenPdf(dto, ecoleNomPrint)

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
