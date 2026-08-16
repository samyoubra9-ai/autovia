"use client"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { formatVitrineMessage } from "@/lib/i18n/vitrine-messages"

const FileDocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h8M8 17h5" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

type CandidatDossierCardProps = {
  showHeader?: boolean
}

export function CandidatDossierCard({ showHeader = false }: CandidatDossierCardProps) {
  const m = useVitrineMessages()
  const items = m.candidatDossier.items
  const printables = m.candidatDossier.printables.items.filter((doc) => doc.downloadUrl)
  const pieceCountLabel = formatVitrineMessage(m.candidatDossier.pieceCount, {
    count: String(items.length),
  })

  return (
    <div className="ds-dossier-card">
      {showHeader ? (
        <div className="ds-inscription-block-head">
          <h2>{m.candidatDossier.title}</h2>
          <p>{m.candidatDossier.subtitle}</p>
        </div>
      ) : null}

      <p className="ds-dossier-count">{pieceCountLabel}</p>

      <ol className="ds-dossier-list">
        {items.map((item, index) => (
          <li key={item.id}>
            <span className="ds-dossier-num" aria-hidden>
              {index + 1}
            </span>
            <span className="ds-dossier-text">{item.text}</span>
          </li>
        ))}
      </ol>

      {printables.length > 0 ? (
        <div className="ds-dossier-printables">
          <div className="ds-dossier-printables-head">
            <h3>{m.candidatDossier.printables.title}</h3>
            <p>{m.candidatDossier.printables.subtitle}</p>
          </div>
          <ul className="ds-printables-list">
            {printables.map((doc) => (
              <li key={doc.id} className="ds-printable-card">
                <div className="ds-printable-card-top">
                  <span className="ds-printable-file-icon" aria-hidden>
                    <FileDocIcon />
                  </span>
                  <div className="ds-printable-copy">
                    <div className="ds-printable-title-row">
                      <h4>{doc.title}</h4>
                      <span className="ds-printable-format">
                        {m.candidatDossier.printables.fileFormat}
                      </span>
                    </div>
                    <p>{doc.description}</p>
                  </div>
                </div>
                <a
                  href={doc.downloadUrl}
                  className="ds-dossier-download ds-dossier-download--primary"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <DownloadIcon />
                  {m.candidatDossier.printables.downloadLabel}
                </a>
              </li>
            ))}
          </ul>
          <p className="ds-dossier-printables-hint">{m.candidatDossier.printables.hint}</p>
        </div>
      ) : null}

      <a href="#inscription-form" className="ds-dossier-scroll-cta">
        {m.candidatDossier.scrollToForm}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </a>
    </div>
  )
}
