import { LandingFooter } from "@/app/components/landing/LandingFooter"
import { LandingNav } from "@/app/components/landing/LandingNav"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getReglementationMessages } from "@/lib/i18n/reglementation-messages"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import { VeilleUpdatesPanel } from "./VeilleUpdatesPanel"

import "../../landing.css"

type Props = {
  locale: VitrineLocale
  links: LandingLinks
}

export function VeilleReglementaireView({ locale, links }: Props) {
  const m = getReglementationMessages(locale)

  return (
    <VitrineLocaleProvider locale={locale}>
      <div className="ds-landing-page ds-veille-page">
        <LandingNav links={links} />

        <main>
          <section className="ds-veille-hero">
            <div className="ds-container">
              <p className="ds-veille-eyebrow">{m.hero.eyebrow}</p>
              <h1>{m.hero.title}</h1>
              <p className="ds-veille-hero-sub">{m.hero.subtitle}</p>
              <p className="ds-veille-hero-lead">{m.hero.lead}</p>
            </div>
          </section>

          <section className="ds-veille-section">
            <div className="ds-container">
              <header className="ds-veille-section-head">
                <h2>{m.section.title}</h2>
                <p>{m.section.subtitle}</p>
              </header>
              <VeilleUpdatesPanel messages={m} locale={locale} />
            </div>
          </section>

          <section className="ds-veille-guide ds-container">
            <h2>{m.guide.title}</h2>
            <ol className="ds-veille-guide-steps">
              {m.guide.steps.map((step, index) => (
                <li key={step.title}>
                  <span className="ds-veille-guide-num">{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="ds-veille-disclaimer">{m.disclaimer}</p>
          </section>

          <section className="ds-veille-cta">
            <div className="ds-container ds-veille-cta-inner">
              <div>
                <h2>{m.cta.title}</h2>
                <p>{m.cta.text}</p>
              </div>
              <a href={m.cta.href} className="ds-btn ds-btn-primary ds-btn-lg">
                {m.cta.button}
              </a>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </VitrineLocaleProvider>
  )
}
