export type ContactPayload = {
  name: string
  email: string
  message: string
  autoEcole?: string
  subject?: string
  website?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseContactBody(
  body: unknown,
): { ok: true; data: ContactPayload } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Corps de requête invalide." }
  }

  const raw = body as Record<string, unknown>

  if (typeof raw.website === "string" && raw.website.trim()) {
    return { ok: false, message: "Requête refusée." }
  }

  const name = String(raw.name ?? "").trim()
  const email = String(raw.email ?? "").trim().toLowerCase()
  const message = String(raw.message ?? "").trim()
  const autoEcole = String(raw.autoEcole ?? "").trim()
  const subject = String(raw.subject ?? "").trim()

  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: "Indiquez votre nom (2 à 120 caractères)." }
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: "Adresse e-mail invalide." }
  }

  if (message.length < 10 || message.length > 5000) {
    return {
      ok: false,
      message: "Le message doit contenir entre 10 et 5000 caractères.",
    }
  }

  if (autoEcole.length > 200) {
    return { ok: false, message: "Nom d'auto-école trop long." }
  }

  if (subject.length > 120) {
    return { ok: false, message: "Sujet trop long." }
  }

  return {
    ok: true,
    data: {
      name,
      email,
      message,
      ...(autoEcole ? { autoEcole } : {}),
      ...(subject ? { subject } : {}),
    },
  }
}
