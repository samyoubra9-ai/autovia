import { LandingFooter } from "@/app/components/landing/LandingFooter"
import { LandingNav } from "@/app/components/landing/LandingNav"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import { CandidatDossierCard } from "@/app/components/inscription/CandidatDossierCard"
import { InscriptionForm } from "@/app/components/inscription/InscriptionForm"
import { InscriptionJourney } from "@/app/components/inscription/InscriptionJourney"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { getVitrineMessages } from "@/lib/i18n/vitrine-messages"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import "../../landing.css"

type Props = {
  locale: VitrineLocale
  links: LandingLinks
}

export function InscriptionView({ locale, links }: Props) {
  const m = getVitrineMessages(locale)

  return (
    <VitrineLocaleProvider locale={locale}>
      <div className="ds-landing-page ds-inscription-page">
        <LandingNav links={links} />

        <main>
          <section className="ds-inscription-hero">
            <div className="ds-container">
              <p className="ds-eyebrow">{m.inscription.hero.eyebrow}</p>
              <h1>{m.inscription.hero.title}</h1>
              <p className="ds-inscription-hero-sub">{m.inscription.hero.subtitle}</p>
              <InscriptionJourney />
            </div>
          </section>

          <section className="ds-inscription-main ds-container">
            <div className="ds-inscription-layout">
              <aside
                id="inscription-dossier"
                className="ds-inscription-aside"
                aria-labelledby="inscription-dossier-title"
              >
                <div className="ds-inscription-panel ds-inscription-panel--dossier">
                  <header className="ds-inscription-panel-head">
                    <span className="ds-inscription-panel-step">1</span>
                    <div>
                      <h2 id="inscription-dossier-title">{m.inscription.dossierPanelTitle}</h2>
                      <p>{m.inscription.dossierPanelSubtitle}</p>
                    </div>
                  </header>
                  <CandidatDossierCard />
                </div>
              </aside>

              <div className="ds-inscription-content">
                <div
                  id="inscription-form"
                  className="ds-inscription-panel ds-inscription-panel--form"
                  aria-labelledby="inscription-form-title"
                >
                  <header className="ds-inscription-panel-head">
                    <span className="ds-inscription-panel-step">2</span>
                    <div>
                      <h2 id="inscription-form-title">{m.inscription.formPanelTitle}</h2>
                      <p>{m.inscription.formPanelSubtitle}</p>
                    </div>
                  </header>
                  <div className="ds-inscription-form-card ds-inscription-form-card--flush">
                    <InscriptionForm />
                  </div>
                </div>

                <aside
                  id="inscription-agence"
                  className="ds-inscription-agency-note"
                  aria-labelledby="inscription-agency-title"
                >
                  <span className="ds-inscription-panel-step ds-inscription-panel-step--muted">3</span>
                  <div>
                    <h3 id="inscription-agency-title">{m.inscription.agencyNoteTitle}</h3>
                    <p>{m.inscription.agencyNoteText}</p>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </VitrineLocaleProvider>
  )
}
