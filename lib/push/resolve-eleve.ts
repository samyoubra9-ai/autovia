import { normalizeCodeSuivi } from "@/lib/api/code-suivi"
import { ApiError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"

export async function resolveEleveIdBySuiviCode(rawCode: string): Promise<string> {
  const code = normalizeCodeSuivi(rawCode)
  if (code.length < 6) {
    throw new ApiError(400, "Code de suivi invalide.")
  }

  const eleve = await prisma.eleve.findFirst({
    where: { codeSuivi: code },
    select: { id: true, codeSuivi: true },
  })

  if (!eleve?.codeSuivi) {
    throw new ApiError(404, "Code de suivi introuvable.")
  }

  return eleve.id
}
