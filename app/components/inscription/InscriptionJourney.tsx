"use client"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"

const STEP_ANCHORS = ["#inscription-dossier", "#inscription-form", "#inscription-agence"] as const

export function InscriptionJourney() {
  const m = useVitrineMessages()
  const steps = [
    { num: 1, title: m.inscription.journey.step1Title, desc: m.inscription.journey.step1Desc },
    { num: 2, title: m.inscription.journey.step2Title, desc: m.inscription.journey.step2Desc },
    { num: 3, title: m.inscription.journey.step3Title, desc: m.inscription.journey.step3Desc },
  ]

  return (
    <ol className="ds-inscription-journey" aria-label={m.inscription.journey.ariaLabel}>
      {steps.map((step, index) => (
        <li key={step.num} className="ds-inscription-journey-step">
          <a className="ds-inscription-journey-link" href={STEP_ANCHORS[index]}>
            <span className="ds-inscription-journey-num" aria-hidden>
              {step.num}
            </span>
            <div className="ds-inscription-journey-copy">
              <strong>{step.title}</strong>
              <span>{step.desc}</span>
            </div>
          </a>
          {index < steps.length - 1 ? (
            <span className="ds-inscription-journey-connector" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  )
}
