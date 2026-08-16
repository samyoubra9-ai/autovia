import { AUTOVIA_CONTACT_EMAIL } from "./constants"

/** E-mail affiché sur le site public (landing, pied de page). */
export function getPublicContactEmail(): string {
  return (
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || AUTOVIA_CONTACT_EMAIL
  )
}
