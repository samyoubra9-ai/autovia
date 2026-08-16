import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import {
  listeSettingsToPrismaUpdate,
  parseListeExamenSettingsInput,
  toListeExamenSettings,
} from "@/lib/api/liste-examen-settings"
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
    if (!ae) {
      return jsonWithCors({ listeSettings: null }, origin)
    }
    return jsonWithCors({ listeSettings: toListeExamenSettings(ae) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}

export async function PATCH(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const tenant = await requireTenant(request)
    const input = parseListeExamenSettingsInput(await request.json())
    const ae = await prisma.autoEcole.update({
      where: { id: tenant.autoEcoleId },
      data: listeSettingsToPrismaUpdate(input),
    })
    return jsonWithCors({ listeSettings: toListeExamenSettings(ae) }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
