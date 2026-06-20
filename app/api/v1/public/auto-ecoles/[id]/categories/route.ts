import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { listPublicCategoriesForAutoEcole } from "@/lib/api/public-auto-ecoles"

type Params = { params: Promise<{ id: string }> }

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

export async function GET(request: Request, { params }: Params) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    const { id } = await params
    const categories = await listPublicCategoriesForAutoEcole(id)
    return jsonWithCors({ categories }, origin)
  } catch (error) {
    return handleApiError(error, origin)
  }
}
