export type UpgradeContactPayload = {
  phone: string
  message: string
}

export function parseUpgradeContactBody(
  body: unknown,
): { ok: true; data: UpgradeContactPayload } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Corps de requête invalide." }
  }

  const raw = body as Record<string, unknown>

  if (typeof raw.website === "string" && raw.website.trim()) {
    return { ok: false, message: "Requête refusée." }
  }

  const phone = String(raw.phone ?? "").trim()
  const message = String(raw.message ?? "").trim()

  const phoneDigits = phone.replace(/\D/g, "")
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return {
      ok: false,
      message: "Indiquez un numéro de téléphone valide (9 à 15 chiffres).",
    }
  }

  if (message.length < 10 || message.length > 5000) {
    return {
      ok: false,
      message: "Le message doit contenir entre 10 et 5000 caractères.",
    }
  }

  return { ok: true, data: { phone, message } }
}
