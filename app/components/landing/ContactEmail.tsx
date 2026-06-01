import { getPublicContactEmail } from "@/lib/contact/public-email"

type ContactEmailProps = {
  className?: string
}

export function ContactEmail({ className }: ContactEmailProps) {
  const email = getPublicContactEmail()
  return (
    <a className={className} href={`mailto:${email}`}>
      {email}
    </a>
  )
}
