/** Numéro WhatsApp affiché sur le site (chiffres uniquement, ex. 213XXXXXXXXX). */
export function getWhatsAppNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  if (!raw) return null
  const digits = raw.replace(/\D/g, "")
  return digits.length >= 8 ? digits : null
}

export function getWhatsAppContactUrl(
  phoneDigits: string,
  presetMessage?: string,
): string {
  const base = `https://wa.me/${phoneDigits}`
  const text = presetMessage?.trim()
  if (!text) return base
  return `${base}?text=${encodeURIComponent(text)}`
}
