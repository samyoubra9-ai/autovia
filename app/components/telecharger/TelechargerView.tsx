"use client"

import { LandingFooter } from "@/app/components/landing/LandingFooter"
import { LandingNav } from "@/app/components/landing/LandingNav"
import type { LandingLinks } from "@/app/components/landing/landing-links"
import { VitrineLocaleProvider } from "@/app/components/vitrine/VitrineLocaleProvider"
import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import "../../landing.css"

function WindowsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3 5.5 10.5 4.2V12H3V5.5zm0 13V13.5h7.5V19.8L3 18.5zM11.25 4 21 2v9.75h-9.75V4zm0 10.5H21V22l-9.75-1.8V14.5z" />
    </svg>
  )
}

function TelechargerContent({ links }: { links: LandingLinks }) {
  const m = useVitrineMessages()
  const d = m.desktop
  const ready = links.backdashDesktopDownloadReady
  const unavailableMessage =
    process.env.NODE_ENV === "development" ? d.unavailableDev : d.unavailable

  return (
    <main>
      <section className="ds-telecharger-hero">
        <div className="ds-container">
          <p className="ds-telecharger-eyebrow">{d.eyebrow}</p>
          <h1>{d.title}</h1>
          <p className="ds-telecharger-lead">{d.pageLead}</p>
        </div>
      </section>

      <section className="ds-telecharger-main">
        <div className="ds-container">
          <div className="ds-telecharger-card">
            <div className="ds-telecharger-card-icon" aria-hidden>
              <WindowsIcon />
            </div>
            <div className="ds-telecharger-card-body">
              <h2>{d.download}</h2>
              <p>{d.subtitle}</p>
              <p className="ds-telecharger-hint">{d.hint}</p>
              {!ready ? (
                <p className="ds-telecharger-unavailable" role="status">
                  {unavailableMessage}
                </p>
              ) : null}
              <div className="ds-telecharger-actions">
                {ready ? (
                  <a
                    href={links.backdashDesktopDownload}
                    className="ds-btn ds-btn-download ds-btn-lg ds-telecharger-download-btn"
                    download="autovia-setup.exe"
                  >
                    <WindowsIcon />
                    {d.download}
                  </a>
                ) : (
                  <span
                    className="ds-btn ds-btn-download ds-btn-lg ds-telecharger-download-btn ds-btn-disabled"
                    aria-disabled="true"
                  >
                    <WindowsIcon />
                    {d.download}
                  </span>
                )}
                <a
                  href={links.backdashSignIn}
                  className="ds-btn ds-btn-secondary ds-btn-lg"
                  rel="noopener noreferrer"
                >
                  {d.orWeb}
                </a>
              </div>
            </div>
          </div>

          <div className="ds-telecharger-steps">
            <h2>{d.stepsTitle}</h2>
            <ol>
              {d.steps.map((step, index) => (
                <li key={step.title}>
                  <span className="ds-telecharger-step-num">{index + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  )
}

type Props = {
  locale: VitrineLocale
  links: LandingLinks
}

export function TelechargerView({ locale, links }: Props) {
  return (
    <VitrineLocaleProvider locale={locale}>
      <div className="ds-landing-page ds-telecharger-page">
        <LandingNav links={links} />
        <TelechargerContent links={links} />
        <LandingFooter />
      </div>
    </VitrineLocaleProvider>
  )
}
