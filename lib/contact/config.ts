export function getContactConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const to = process.env.CONTACT_TO_EMAIL?.trim()
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    "Autovia <onboarding@resend.dev>"

  return { apiKey, to, from }
}

export function isContactConfigured(): boolean {
  const { apiKey, to } = getContactConfig()
  return Boolean(apiKey && to)
}
