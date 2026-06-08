import Link from "next/link"
import Image from "next/image"

import { LandingFooter } from "@/app/components/landing/LandingFooter"
import { LocaleSwitcher } from "@/app/components/vitrine/LocaleSwitcher"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getPublicContactEmail } from "@/lib/contact/public-email"
import {
  getLegalDocumentKey,
  getLegalMessages,
  interpolateLegalText,
  type LegalSlug,
} from "@/lib/i18n/legal-messages"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import "../../landing.css"

type LegalPageViewProps = {
  slug: LegalSlug
  locale: VitrineLocale
}

export function LegalPageView({ slug, locale }: LegalPageViewProps) {
  const vitrine = getVitrineMessages(locale)
  const legal = getLegalMessages(locale)
  const docKey = getLegalDocumentKey(slug)
  const doc = legal[docKey]
  const email = getPublicContactEmail()
  const vars = { email }

  return (
    <VitrineLocaleProvider locale={locale}>
      <div className="ds-landing-page ds-legal-page">
        <header className="ds-legal-header">
          <div className="ds-container ds-legal-header-inner">
            <Link href="/" className="ds-logo" aria-label={vitrine.nav.logoAria}>
              <Image
                src="/brand/favicon/favicon-96x96.png"
                alt=""
                width={32}
                height={32}
                className="ds-logo-img"
              />
              Auto<span>via</span>
            </Link>
            <div className="ds-legal-header-actions">
              <LocaleSwitcher />
              <Link href="/" className="ds-btn ds-btn-ghost ds-btn-nav">
                {vitrine.footer.legalBack}
              </Link>
            </div>
          </div>
        </header>

        <main className="ds-legal-main">
          <article className="ds-container ds-legal-article">
            <header className="ds-legal-doc-head">
              <p className="ds-legal-doc-eyebrow">{doc.lastUpdated}</p>
              <h1>{doc.title}</h1>
            </header>

            <div className="ds-legal-sections">
              {doc.sections.map((section, index) => {
                const sectionId =
                  "id" in section && section.id ? section.id : `section-${index}`
                return (
                  <section
                    key={sectionId}
                    id={sectionId}
                    className="ds-legal-section"
                  >
                    <h2>{section.title}</h2>
                    {section.paragraphs.map((paragraph, pIndex) => (
                      <p key={`${sectionId}-${pIndex}`}>
                        {interpolateLegalText(paragraph, vars)}
                      </p>
                    ))}
                  </section>
                )
              })}
            </div>
          </article>
        </main>

        <LandingFooter />
      </div>
    </VitrineLocaleProvider>
  )
}
