import type { AutoEcole } from "@prisma/client"
import { ApiError } from "@/lib/api/errors"

export type ListeExamenSettings = {
  ageMinCirculation: number
  natureCodeActive: boolean
  natureCreneauActive: boolean
  natureCirculationActive: boolean
}

export type ListeExamenSettingsInput = Partial<ListeExamenSettings>

export function toListeExamenSettings(ae: AutoEcole): ListeExamenSettings {
  return {
    ageMinCirculation: ae.listeAgeMinCirculation ?? 18,
    natureCodeActive: ae.listeNatureCodeActive ?? true,
    natureCreneauActive: ae.listeNatureCreneauActive ?? true,
    natureCirculationActive: ae.listeNatureCirculationActive ?? true,
  }
}

export function parseListeExamenSettingsInput(body: unknown): ListeExamenSettingsInput {
  if (!body || typeof body !== "object") throw new ApiError(400, "Corps invalide.")
  const b = body as Record<string, unknown>
  const out: ListeExamenSettingsInput = {}
  if (b.ageMinCirculation !== undefined) {
    const n = Number(b.ageMinCirculation)
    if (!Number.isFinite(n) || n < 16 || n > 99) {
      throw new ApiError(400, "Âge minimum circulation : entre 16 et 99 ans.")
    }
    out.ageMinCirculation = Math.round(n)
  }
  if (b.natureCodeActive !== undefined) out.natureCodeActive = Boolean(b.natureCodeActive)
  if (b.natureCreneauActive !== undefined) out.natureCreneauActive = Boolean(b.natureCreneauActive)
  if (b.natureCirculationActive !== undefined) {
    out.natureCirculationActive = Boolean(b.natureCirculationActive)
  }
  return out
}

export function listeSettingsToPrismaUpdate(input: ListeExamenSettingsInput) {
  const data: Record<string, unknown> = {}
  if (input.ageMinCirculation !== undefined) {
    data.listeAgeMinCirculation = input.ageMinCirculation
  }
  if (input.natureCodeActive !== undefined) {
    data.listeNatureCodeActive = input.natureCodeActive
  }
  if (input.natureCreneauActive !== undefined) {
    data.listeNatureCreneauActive = input.natureCreneauActive
  }
  if (input.natureCirculationActive !== undefined) {
    data.listeNatureCirculationActive = input.natureCirculationActive
  }
  return data
}
