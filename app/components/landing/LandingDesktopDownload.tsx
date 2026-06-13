import type { LandingLinks } from "./landing-links"

type DesktopMessages = {
  eyebrow: string
  title: string
  subtitle: string
  download: string
  hint: string
  orWeb: string
  unavailable: string
  unavailableDev: string
}

export function LandingDesktopDownload({
  links,
  messages,
}: {
  links: LandingLinks
  messages: DesktopMessages
}) {
  if (!links.backdashDesktopDownload) return null

  const ready = links.backdashDesktopDownloadReady
  const unavailableMessage =
    process.env.NODE_ENV === "development"
      ? messages.unavailableDev
      : messages.unavailable

  return (
    <section id="telecharger" className="ds-desktop-download" aria-labelledby="desktop-download-title">
      <div className="ds-container ds-desktop-download-inner">
        <div className="ds-desktop-download-copy">
          <p className="ds-eyebrow">{messages.eyebrow}</p>
          <h2 id="desktop-download-title">{messages.title}</h2>
          <p className="ds-desktop-download-subtitle">{messages.subtitle}</p>
          <p className="ds-desktop-download-hint">{messages.hint}</p>
          {!ready ? (
            <p className="ds-desktop-download-unavailable" role="status">
              {unavailableMessage}
            </p>
          ) : null}
        </div>
        <div className="ds-desktop-download-actions">
          {ready ? (
            <a
              href={links.backdashDesktopDownload}
              className="ds-btn ds-btn-primary ds-btn-lg ds-desktop-download-btn"
              download="autovia-setup.exe"
            >
              <WindowsIcon />
              {messages.download}
            </a>
          ) : (
            <span
              className="ds-btn ds-btn-primary ds-btn-lg ds-desktop-download-btn ds-btn-disabled"
              aria-disabled="true"
            >
              <WindowsIcon />
              {messages.download}
            </span>
          )}
          <a
            href={links.backdashSignIn}
            className="ds-btn ds-btn-secondary ds-btn-lg"
            rel="noopener noreferrer"
          >
            {messages.orWeb}
          </a>
        </div>
      </div>
    </section>
  )
}

function WindowsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3 5.5 10.5 4.2V12H3V5.5zm0 13V13.5h7.5V19.8L3 18.5zM11.25 4 21 2v9.75h-9.75V4zm0 10.5H21V22l-9.75-1.8V14.5z" />
    </svg>
  )
}
