import { jsonWithCors } from "@/lib/api/cors"
import { isNetworkError, NETWORK_ERROR_MESSAGE } from "@/lib/api/network"
import { Prisma } from "@prisma/client"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message)
  }
}

const isDev = process.env.NODE_ENV !== "production"

const PROD_SCHEMA_ERROR =
  "Service temporairement indisponible. Réessayez plus tard ou contactez le support."

function prismaUserMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null
  const msg = String((error as Error).message ?? "")

  if (msg.includes("Unknown field") && msg.includes("SeanceExamen")) {
    return isDev
      ? "Le serveur API doit être redémarré après la mise à jour : arrêtez Next.js, exécutez « npx prisma generate », puis « npm run dev »."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("liste_age_min_circulation") || msg.includes("liste_nature_")) {
    return isDev
      ? "Colonnes paramètres listes d'examen manquantes. Exécutez supabase/migrations/20260515370000_schema_sync_repair.sql dans Supabase SQL Editor, puis redémarrez l'API."
      : PROD_SCHEMA_ERROR
  }

  if (
    msg.includes("column") &&
    (msg.includes("does not exist") || msg.includes("n'existe pas"))
  ) {
    return isDev
      ? "Migration base de données manquante. Exécutez supabase/migrations/20260515370000_schema_sync_repair.sql dans Supabase SQL Editor, puis redémarrez l'API."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("SeanceStatut") || msg.includes("etape_code_validee")) {
    return isDev
      ? "Migration base de données incomplète. Exécutez supabase/migrations/20260515170000_intelligence_features.sql puis redémarrez l'API."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("candidat_engagements") || msg.includes("CandidatEngagement")) {
    return isDev
      ? "Table confirmations candidat manquante. Exécutez supabase/migrations/20260604000000_candidat_engagements.sql ou docs/sql/candidat-engagements-prod.sql dans Supabase, puis npx prisma generate."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("code_suivi")) {
    return isDev
      ? "Colonne code de suivi manquante. Exécutez supabase/migrations/20260515200000_eleve_code_suivi.sql dans Supabase."
      : PROD_SCHEMA_ERROR
  }

  if (
    msg.includes("SeanceType") ||
    msg.includes("seances_examen.type") ||
    (msg.includes("type") && msg.includes("seances_examen"))
  ) {
    return isDev
      ? "Colonne « type » manquante sur les séances. Exécutez supabase/migrations/20260515190000_seance_type.sql dans Supabase SQL Editor, puis redémarrez l'API."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("categories_permis") || msg.includes("categorie_permis_id")) {
    return isDev
      ? "Table catégories de permis manquante. Exécutez supabase/migrations/20260515350000_categories_permis_ecole.sql dans Supabase, puis npx prisma generate."
      : PROD_SCHEMA_ERROR
  }

  if (msg.includes("categorie_permis") && msg.includes("moniteurs")) {
    return isDev
      ? "Colonne catégorie moniteur manquante. Exécutez supabase/migrations/20260515330000_moniteur_arabe_categorie.sql dans Supabase, puis npx prisma generate."
      : PROD_SCHEMA_ERROR
  }

  if (
    msg.includes("listes_examen") ||
    msg.includes("liste_examen_candidats") ||
    msg.includes("ListeExamen") ||
    msg.includes("GroupePermisListe") ||
    msg.includes("NatureExamenListe")
  ) {
    return isDev
      ? "Tables listes d'examen manquantes ou incomplètes. Exécutez supabase/migrations/20260515320000_listes_examen_repair.sql dans Supabase SQL Editor, puis redémarrez l'API (npx prisma generate && npm run dev)."
      : PROD_SCHEMA_ERROR
  }

  if (
    msg.includes("resultat_examen_candidat") ||
    (msg.includes("resultat") && msg.includes("liste_examen"))
  ) {
    return isDev
      ? "Colonne résultat incompatible. Exécutez supabase/migrations/20260515320000_listes_examen_repair.sql dans Supabase SQL Editor, puis redémarrez l'API."
      : PROD_SCHEMA_ERROR
  }

  return null
}

export function handleApiError(error: unknown, origin: string) {
  if (error instanceof ApiError) {
    return jsonWithCors(
      { error: error.message, ...(error.code ? { code: error.code } : {}) },
      origin,
      { status: error.status },
    )
  }

  if (isNetworkError(error)) {
    console.error("[api] network", error)
    return jsonWithCors(
      { error: NETWORK_ERROR_MESSAGE, code: "NETWORK_ERROR" },
      origin,
      { status: 503 },
    )
  }

  console.error("[api]", error)
  const msg = String((error as Error)?.message ?? error)
  if (
    error instanceof Error &&
    !prismaUserMessage(error) &&
    (/\binvalide\b/i.test(msg) || /\brequis/i.test(msg))
  ) {
    return jsonWithCors({ error: msg }, origin, { status: 400 })
  }
  const hint = prismaUserMessage(error)
  const prismaCode =
    error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined
  return jsonWithCors(
    {
      error:
        hint ??
        (isDev
          ? "Erreur serveur. Vérifiez les logs du terminal Next.js."
          : "Une erreur s'est produite. Réessayez plus tard."),
      ...(isDev ? { detail: msg.slice(0, 500) } : {}),
      ...(prismaCode ? { code: prismaCode } : {}),
    },
    origin,
    { status: 500 },
  )
}
