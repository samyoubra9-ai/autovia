import "@sparticuz/chromium-min"
import "puppeteer-core"
import { getAllowedOrigin, corsHeaders } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { assertCanPrintOnPlan } from "@/lib/api/trial-plan-context"
import { buildFicheAvancementDataFromEleve } from "@/lib/fiche-avancement-print/build-data"
import { generateFicheAvancementPdf } from "@/lib/fiche-avancement-print/generate-pdf"
import { renderFicheAvancementPrintHtml } from "@/lib/fiche-avancement-print/render-html"
import { prisma } from "@/lib/prisma"

export const maxDuration = 60
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

const eleveInclude = {
  categoriePermis: true,
  moniteur: true,
  vehicule: true,
} as const

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^\w\u0600-\u06FF.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

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

    const [eleve, autoEcole] = await Promise.all([
      prisma.eleve.findFirst({
        where: { id, autoEcoleId: tenant.autoEcoleId },
        include: eleveInclude,
      }),
      prisma.autoEcole.findUnique({ where: { id: tenant.autoEcoleId } }),
    ])

    if (!eleve) throw new ApiError(404, "Élève introuvable.")
    if (!autoEcole) throw new ApiError(404, "Auto-école introuvable.")

    const data = buildFicheAvancementDataFromEleve(eleve, autoEcole)
    const safeName = [
      sanitizeFilenamePart(data.prenom),
      sanitizeFilenamePart(data.nom),
    ]
      .filter(Boolean)
      .join("-")
    const filename = safeName
      ? `fiche-avancement-${safeName}.pdf`
      : `fiche-avancement-${id}.pdf`

    if (format === "html") {
      const html = renderFicheAvancementPrintHtml(data, { runFitInline: true })
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    assertCanPrintOnPlan(autoEcole.subscriptionStatus)

    const pdf = await generateFicheAvancementPdf(data)

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
