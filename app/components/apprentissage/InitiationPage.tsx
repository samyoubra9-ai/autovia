"use client"

import Link from "next/link"
import { ArrowRight, Compass, Layers } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  getInitiationLabel,
  INITIATION,
} from "@/lib/apprentissage/initiation"
import { getPanneauxHref } from "@/lib/apprentissage/tracks/routes"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"

import { InitiationSchema } from "./InitiationSchema"

export function InitiationPageView() {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)

  return (
    <div className="ap-page ap-init-page">
      <header className="ap-page-head">
        <Badge>{m.initiation.badge}</Badge>
        <h1>{getInitiationLabel(INITIATION.title, locale)}</h1>
        <p>{getInitiationLabel(INITIATION.description, locale)}</p>
      </header>

      <section className="ap-init-intro">
        <div className="ap-init-intro-icon">
          <Compass className="size-6" aria-hidden />
        </div>
        <p>{m.initiation.hint}</p>
      </section>

      <section className="ap-init-legend" aria-label={m.initiation.legendTitle}>
        <span className="ap-init-legend-title">
          <Layers className="size-3.5" aria-hidden />
          {m.initiation.legendTitle}
        </span>
        <ul className="ap-init-legend-list">
          <li>
            <span className="ap-init-legend-swatch ap-init-legend-swatch--root" />
            {m.initiation.legendRoot}
          </li>
          <li>
            <span className="ap-init-legend-swatch ap-init-legend-swatch--reglement" />
            {m.initiation.legendReglement}
          </li>
          <li>
            <span className="ap-init-legend-swatch ap-init-legend-swatch--signalisation" />
            {m.initiation.legendSignalisation}
          </li>
        </ul>
      </section>

      <InitiationSchema
        root={INITIATION.root}
        expandHint={m.initiation.expandBranch}
        exploreCta={m.initiation.exploreModule}
        comingSoonLabel={m.initiation.comingSoon}
        sectionsCountLabel={(count) =>
          formatApprentissageMessage(m.initiation.sectionsCount, { count })
        }
      />

      <section className="ap-init-footer-cta">
        <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
          <Link href={getPanneauxHref()}>
            {m.initiation.continueToPanneaux}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
