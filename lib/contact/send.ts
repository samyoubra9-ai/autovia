import { Resend } from "resend"

import { getContactConfig } from "./config"
import { escapeHtml } from "./escape-html"
import type { ContactPayload } from "./validate"

export async function sendContactEmail(payload: ContactPayload): Promise<void> {
  const { apiKey, to, from } = getContactConfig()

  if (!apiKey || !to) {
    throw new Error("CONTACT_NOT_CONFIGURED")
  }

  const resend = new Resend(apiKey)
  const subjectLabels: Record<string, string> = {
    demo: "Demande de démo",
    tarifs: "Question tarifs",
    support: "Support technique",
    autre: "Autre",
  }
  const subjectKey = payload.subject?.trim()
  const subjectLine = subjectKey ? subjectLabels[subjectKey] ?? subjectKey : ""
  const emailSubject = subjectLine
    ? `[Autovia] ${subjectLine} — ${payload.name}`
    : `[Autovia] Contact — ${payload.name}`

  const autoEcoleRow = payload.autoEcole
    ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">Auto-école</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeHtml(payload.autoEcole)}</td></tr>`
    : ""

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px;">
      <h2 style="margin:0 0 16px;font-size:18px;">Nouveau message depuis autovia.space</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;width:120px;">Nom</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeHtml(payload.name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">E-mail</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;"><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td>
        </tr>
        ${autoEcoleRow}
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;vertical-align:top;">Message</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(payload.message)}</td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#64748b;">Répondez directement à cet e-mail pour joindre l'expéditeur.</p>
    </div>
  `.trim()

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: payload.email,
    subject: emailSubject,
    html,
  })

  if (error) {
    throw new Error(error.message || "RESEND_SEND_FAILED")
  }
}
