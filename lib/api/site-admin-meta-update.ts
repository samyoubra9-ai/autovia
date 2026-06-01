import type { AutoEcole } from "@prisma/client"
import type { SiteAdminAccessPatchBody } from "@/lib/api/site-admin-access-update"

export function isSiteAdminMetaOnlyPatch(body: SiteAdminAccessPatchBody): boolean {
  if (body.action !== undefined || body.subscriptionStatus !== undefined) {
    return false
  }
  return (
    body.adminNotes !== undefined ||
    body.paidUntil !== undefined ||
    body.nom !== undefined ||
    body.ville !== undefined ||
    body.telephone !== undefined ||
    body.emailContact !== undefined
  )
}

export function buildSiteAdminMetaUpdateData(
  body: SiteAdminAccessPatchBody,
  _ae: AutoEcole,
): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  if (body.adminNotes !== undefined) {
    data.adminNotes = String(body.adminNotes).trim() || null
  }

  if (body.nom !== undefined) {
    const nom = String(body.nom).trim()
    if (nom.length < 2) throw new Error("Nom d'auto-école trop court.")
    data.nom = nom
  }

  if (body.ville !== undefined) {
    data.ville = String(body.ville).trim() || null
  }

  if (body.telephone !== undefined) {
    data.telephone = String(body.telephone).trim() || null
  }

  if (body.emailContact !== undefined) {
    const email = String(body.emailContact).trim()
    data.emailContact = email || null
  }

  if (body.paidUntil !== undefined) {
    if (body.paidUntil === null || body.paidUntil === "") {
      data.paidUntil = null
    } else {
      const d = new Date(body.paidUntil)
      if (Number.isNaN(d.getTime())) {
        throw new Error("Date de fin d'abonnement invalide.")
      }
      data.paidUntil = d
      if (d > new Date()) {
        data.subscriptionStatus = "ACTIVE"
      }
    }
  }

  return data
}
