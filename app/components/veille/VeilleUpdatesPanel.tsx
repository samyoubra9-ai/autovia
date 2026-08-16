"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BookOpen,
  Car,
  ChevronDown,
  Scale,
  Shield,
} from "lucide-react"

import type { ReglementationMessages } from "@/lib/i18n/reglementation-messages"
import { formatReglementationDate } from "@/lib/i18n/reglementation-messages"
import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  circulation: Car,
  "police-amendes": Shield,
  procedures: Scale,
}

const IMPORTANCE_LABELS: Record<string, string> = {
  high: "Priorité haute",
  medium: "À suivre",
  low: "Information",
}

type Props = {
  messages: ReglementationMessages
  locale: VitrineLocale
}

export function VeilleUpdatesPanel({ messages, locale }: Props) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(
    messages.updates[0]?.id ?? null,
  )

  const categoryLabelById = useMemo(
    () => Object.fromEntries(messages.categories.map((c) => [c.id, c.label])),
    [messages.categories],
  )

  const filtered = useMemo(() => {
    if (activeCategory === "all") return messages.updates
    return messages.updates.filter((u) => u.category === activeCategory)
  }, [activeCategory, messages.updates])

  return (
    <div className="ds-veille-content">
      <div className="ds-veille-filters" role="tablist" aria-label="Filtrer par thème">
        {messages.categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`ds-veille-filter${activeCategory === cat.id ? " ds-veille-filter--active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="ds-veille-empty">Aucune fiche dans cette catégorie pour le moment.</p>
      ) : (
        <ol className="ds-veille-timeline">
          {filtered.map((update) => {
            const Icon = CATEGORY_ICONS[update.category] ?? Car
            const isOpen = expandedId === update.id
            return (
              <li key={update.id} className="ds-veille-card">
                <div className="ds-veille-card-head">
                  <div className="ds-veille-card-icon" aria-hidden>
                    <Icon className="size-5" />
                  </div>
                  <div className="ds-veille-card-meta">
                    <time dateTime={update.date}>
                      {formatReglementationDate(update.date, locale)}
                    </time>
                    <span className="ds-veille-card-dot" aria-hidden>
                      ·
                    </span>
                    <span>{categoryLabelById[update.category]}</span>
                    {update.importance === "high" && (
                      <span className="ds-veille-priority">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        {IMPORTANCE_LABELS.high}
                      </span>
                    )}
                  </div>
                  <h2 className="ds-veille-card-title">{update.title}</h2>
                  <p className="ds-veille-card-summary">{update.summary}</p>
                  <div className="ds-veille-tags">
                    {update.tags.map((tag) => (
                      <span key={tag} className="ds-veille-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="ds-veille-toggle"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setExpandedId(isOpen ? null : update.id)
                  }
                >
                  {isOpen ? "Masquer le détail" : "Lire la synthèse"}
                  <ChevronDown
                    className={`size-4 transition-transform${isOpen ? " rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>

                {isOpen && (
                  <div className="ds-veille-card-body">
                    {update.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    <p className="ds-veille-source">
                      Source : {update.sourceLabel}
                      {update.sourceUrl ? (
                        <>
                          {" — "}
                          <a
                            href={update.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Consulter
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
