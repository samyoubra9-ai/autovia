import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { ApiError, handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  parseAutoEcolePrintInput,
  printSettingsToPrismaUpdate,
  toAutoEcolePrintSettings,
} from "@/lib/api/auto-ecole-print"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const ae = await prisma.autoEcole.findUnique({
      where: { id: tenant.autoEcoleId },
    })
    if (!ae) throw new ApiError(404, "Auto-école introuvable.")
    return jsonWithCors({ printSettings: toAutoEcolePrintSettings(ae) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function PATCH(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const body = await request.json()
    const input = parseAutoEcolePrintInput(body)

    const ae = await prisma.autoEcole.update({
      where: { id: tenant.autoEcoleId },
      data: printSettingsToPrismaUpdate(input),
    })

    return jsonWithCors({ printSettings: toAutoEcolePrintSettings(ae) }, origin)
  } catch (error) {
    if (error instanceof Error && error.message.includes("invalide")) {
      return handleApiError(new ApiError(400, error.message), origin)
    }
    return handleApiError(error, origin)
  }
}
