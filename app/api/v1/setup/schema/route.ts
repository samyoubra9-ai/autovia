import { getAllowedOrigin, jsonWithCors } from "@/lib/api/cors"
import { handleApiError } from "@/lib/api/errors"
import { requireTenant } from "@/lib/api/auth"
import { prisma } from "@/lib/prisma"

export async function OPTIONS(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  return new Response(null, { status: 204, headers: { ...jsonWithCors({}, origin).headers } })
}

/** Vérifie que la base prod a les tables/colonnes moniteur principal (diagnostic déploiement). */
export async function GET(request: Request) {
  const origin = getAllowedOrigin(request.headers.get("origin"))
  try {
    await requireTenant(request)

    const [pivot, principalCol] = await Promise.all([
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'moniteur_categories_permis'
        ) AS "exists"
      `,
      prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'moniteurs'
            AND column_name = 'est_principal'
        ) AS "exists"
      `,
    ])

    const moniteurCategoriesPivot = Boolean(pivot[0]?.exists)
    const moniteurEstPrincipal = Boolean(principalCol[0]?.exists)
    const ok = moniteurCategoriesPivot && moniteurEstPrincipal

    return jsonWithCors(
      {
        ok,
        moniteurCategoriesPivot,
        moniteurEstPrincipal,
        hint: ok
          ? null
          : "Exécutez docs/sql/moniteur-principal-prod.sql sur Supabase production, puis redéployez l’API (projet Vercel racine).",
      },
      origin,
    )
  } catch (error) {
    return handleApiError(error, origin)
  }
}
