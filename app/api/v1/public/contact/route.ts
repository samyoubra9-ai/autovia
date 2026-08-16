import { NextResponse } from "next/server"

import { isContactConfigured } from "@/lib/contact/config"
import { checkContactRateLimit, getClientIp } from "@/lib/contact/rate-limit"
import { sendContactEmail } from "@/lib/contact/send"
import { parseContactBody } from "@/lib/contact/validate"

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    return NextResponse.json(
      { error: "Le formulaire de contact n'est pas configuré." },
      { status: 503 },
    )
  }

  const ip = getClientIp(request)
  if (!checkContactRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessayez dans une heure." },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 })
  }

  const parsed = parseContactBody(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 })
  }

  try {
    await sendContactEmail(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    console.error("[contact]", message)

    if (message === "CONTACT_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Le formulaire de contact n'est pas configuré." },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        error:
          "Impossible d'envoyer le message pour le moment. Réessayez plus tard ou écrivez-nous directement par e-mail.",
      },
      { status: 502 },
    )
  }
}
