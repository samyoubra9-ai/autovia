import { getAllowedOrigin, corsHeaders } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireSiteAdminApi } from "@/lib/api/site-admin-auth"
import { logSiteAdminAction } from "@/lib/api/site-admin-audit"
import { prisma } from "@/lib/prisma"
import type { VerificationDocumentKind } from "@prisma/client"
import { downloadVerificationDocument } from "@/lib/verification/storage"
import { documentKindLabel } from "@/lib/verification/constants"

type Params = { params: Promise<{ id: string; kind: string }> }

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
    const { siteAdmin } = await requireSiteAdminApi(request)
    const { id, kind: kindRaw } = await params
    const kind = kindRaw.toUpperCase() as VerificationDocumentKind
    if (kind !== "AGREMENT" && kind !== "IDENTITE") {
      throw new ApiError(400, "Type de document invalide.")
    }

    const doc = await prisma.autoEcoleVerificationDocument.findUnique({
      where: { autoEcoleId_kind: { autoEcoleId: id, kind } },
    })
    if (!doc) throw new ApiError(404, "Document introuvable.")

    const { bytes, contentType } = await downloadVerificationDocument(doc.storagePath)
    const safeName = doc.fileName.replace(/[^\w.\-() ]+/g, "_")

    await logSiteAdminAction(prisma, {
      siteAdminId: siteAdmin.id,
      autoEcoleId: id,
      action: "verification_download",
      detail: documentKindLabel(kind),
    })

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
      },
    })
  } catch (error) {
    return handleApiError(error, origin)
  }
}
