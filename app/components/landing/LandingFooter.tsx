"use client"

import Image from "next/image"
import type { ReactNode } from "react"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { ContactEmail } from "./ContactEmail"

function FooterLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a href={href} className="ds-footer-link">
      {children}
    </a>
  )
}

export function LandingFooter() {
  const m = useVitrineMessages()
  const year = new Date().getFullYear()

  return (
    <footer className="ds-footer">
      <div className="ds-container">
        <div className="ds-footer-grid">
          <div className="ds-footer-brand">
            <a href="/" className="ds-logo ds-footer-logo">
              <Image
                src="/brand/favicon/favicon-96x96.png"
                alt=""
                width={32}
                height={32}
                className="ds-logo-img"
              />
              Auto<span>via</span>
            </a>
            <p className="ds-footer-tagline">{m.footer.tagline}</p>
          </div>

          <div className="ds-footer-col">
            <h3 className="ds-footer-col-title">{m.footer.productTitle}</h3>
            <nav className="ds-footer-nav" aria-label={m.footer.productTitle}>
              <FooterLink href="/apprendre">{m.footer.linkLearn}</FooterLink>
              <FooterLink href="/#features">{m.footer.linkFeatures}</FooterLink>
              <FooterLink href="/#pricing">{m.footer.linkPricing}</FooterLink>
              <FooterLink href="/#faq">{m.footer.linkFaq}</FooterLink>
              <FooterLink href="/#contact">{m.footer.linkContact}</FooterLink>
            </nav>
          </div>

          <div className="ds-footer-col">
            <h3 className="ds-footer-col-title">{m.footer.legalTitle}</h3>
            <nav className="ds-footer-nav" aria-label={m.footer.legalTitle}>
              <FooterLink href="/legal/mentions-legales">
                {m.footer.linkMentions}
              </FooterLink>
              <FooterLink href="/legal/confidentialite">
                {m.footer.linkPrivacy}
              </FooterLink>
              <FooterLink href="/legal/cgu">{m.footer.linkCgu}</FooterLink>
              <FooterLink href="/legal/confidentialite#cookies">
                {m.footer.linkCookies}
              </FooterLink>
            </nav>
          </div>

          <div className="ds-footer-col">
            <h3 className="ds-footer-col-title">{m.footer.contactTitle}</h3>
            <p className="ds-footer-contact-hint">{m.footer.contactHint}</p>
            <ContactEmail className="ds-footer-email ds-footer-email--block" />
          </div>
        </div>

        <div className="ds-footer-bottom">
          <p className="ds-footer-credits">
            {m.footer.creditsPrefix}{" "}
            <strong>{m.footer.moniteurName}</strong>, {m.footer.moniteurRole}{" "}
            {m.footer.creditsJoin}{" "}
            <strong>{m.footer.developerName}</strong>, {m.footer.developerRole}.
          </p>
          <p className="ds-footer-meta">
            <span>&copy; {year} {m.footer.copyright}</span>
            <span className="ds-footer-meta-sep" aria-hidden>
              ·
            </span>
            <ContactEmail className="ds-footer-email" />
          </p>
        </div>
      </div>
    </footer>
  )
}
