import { randomBytes } from "node:crypto"
import { getCandidatUrl } from "@/lib/app-urls"
import { prisma } from "@/lib/prisma"

/** Sans 0/O, 1/I/L pour faciliter la saisie */
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generateCodeSuiviRaw(length = 8): string {
  const bytes = randomBytes(length)
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("")
}

export function normalizeCodeSuivi(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase()
}

export function formatCodeSuiviDisplay(code: string): string {
  const n = normalizeCodeSuivi(code)
  if (n.length <= 4) return n
  return `${n.slice(0, 4)}-${n.slice(4)}`
}

/** Lien QR / carte élève → PWA candidat (ex. candidat.autovia.space/s/CODE). */
export function getSuiviPublicUrl(code: string): string {
  const base = getCandidatUrl().replace(/\/$/, "")
  return `${base}/s/${normalizeCodeSuivi(code)}`
}

export async function generateUniqueCodeSuivi(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateCodeSuiviRaw(8)
    const existing = await prisma.eleve.findFirst({
      where: { codeSuivi: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  throw new Error("Impossible de générer un code de suivi unique.")
}

export async function ensureEleveCodeSuivi(eleveId: string): Promise<string> {
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    select: { codeSuivi: true },
  })
  if (!eleve) throw new Error("Élève introuvable.")
  if (eleve.codeSuivi) return eleve.codeSuivi
  const code = await generateUniqueCodeSuivi()
  await prisma.eleve.update({
    where: { id: eleveId },
    data: { codeSuivi: code },
  })
  return code
}
