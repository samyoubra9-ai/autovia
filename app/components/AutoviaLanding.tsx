"use client"

import { useState, type ReactNode } from "react"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { formatVitrineMessage } from "@/lib/i18n/vitrine-messages"
import { SUBSCRIPTION_PRICING, formatDzdAmount } from "@/lib/subscription-plans"

import { LandingImage } from "./landing/LandingImage"
import { LandingImageFrame } from "./landing/LandingImageFrame"
import { FEATURE_BLOCK_IMAGE_BY_ID } from "./landing/landing-data"
import { ContactForm } from "./landing/ContactForm"
import { ContactEmail } from "./landing/ContactEmail"
import { LandingFooter } from "./landing/LandingFooter"
import { LandingNav } from "./landing/LandingNav"
import { buildProductCards, type LandingLinks } from "./landing/landing-links"

const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

type PaidPlanPricing = {
  annualDzd: number
  monthlyDzd: number
  annualFromMonthlyDzd: number
  annualSavingsVsMonthlyDzd: number
}

function formatPaidPlanDisplay(
  plan: PaidPlanPricing,
  annual: boolean,
  periodYear: string,
  periodMonth: string,
  annualCalcTemplate: string,
  monthlyCalcTemplate: string,
) {
  const price = annual
    ? formatDzdAmount(plan.annualDzd).replace(" DZD", "")
    : formatDzdAmount(plan.monthlyDzd).replace(" DZD", "")
  const period = annual ? periodYear : periodMonth
  const calc = annual
    ? formatVitrineMessage(annualCalcTemplate, {
        monthlyEquivalent: formatDzdAmount(Math.round(plan.annualDzd / 12)),
        savings: formatDzdAmount(plan.annualSavingsVsMonthlyDzd),
      })
    : formatVitrineMessage(monthlyCalcTemplate, {
        annualTotal: formatDzdAmount(plan.annualFromMonthlyDzd),
      })
  return { price, period, calc }
}

function LandingAnchor({
  href,
  external,
  className,
  children,
}: {
  href: string
  external?: boolean
  className?: string
  children: ReactNode
}) {
  if (external) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function AutoviaLanding({ links }: { links: LandingLinks }) {
  const m = useVitrineMessages()
  const products = buildProductCards(links, m.products.cards)
  const [paidAnnual, setPaidAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const essentiel = SUBSCRIPTION_PRICING.ESSENTIEL
  const connect = SUBSCRIPTION_PRICING.ESSENTIEL_CONNECT
  const pro = SUBSCRIPTION_PRICING.PRO

  const paidPlans = [
    {
      id: "essentiel",
      tag: m.pricing.essentiel.tag,
      title: m.pricing.essentiel.title,
      pricing: essentiel,
      features: m.pricing.essentiel.features,
      cta: m.pricing.essentiel.cta,
      variant: "essentiel" as const,
      primary: false,
    },
    {
      id: "connect",
      tag: m.pricing.essentielConnect.tag,
      title: m.pricing.essentielConnect.title,
      pricing: connect,
      features: m.pricing.essentielConnect.features,
      cta: m.pricing.essentielConnect.cta,
      variant: "connect" as const,
      primary: true,
    },
    {
      id: "pro",
      tag: m.pricing.pro.tag,
      title: m.pricing.pro.title,
      pricing: pro,
      features: m.pricing.pro.features,
      cta: m.pricing.pro.cta,
      variant: "pro" as const,
      primary: false,
    },
  ]

  const featureBlocks = m.features.blocks.map((block, index) => {
    const id = block.id as keyof typeof FEATURE_BLOCK_IMAGE_BY_ID
    return {
      ...block,
      imageKey: FEATURE_BLOCK_IMAGE_BY_ID[id],
      reverse: index === 1,
    }
  })

  return (
    <div className="ds-landing-page">
      <LandingNav links={links} />

      <section className="ds-hero">
        <div className="ds-container ds-hero-grid">
          <div className="ds-hero-copy">
            <span className="ds-badge">{m.hero.badge}</span>
            <h1>{m.hero.title}</h1>
            <p className="ds-hero-lead">{m.hero.lead}</p>
            <ul className="ds-hero-bullets">
              {m.hero.bullets.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
            <div className="ds-hero-cta">
              <LandingAnchor
                href={links.backdashSignUp}
                external
                className="ds-btn ds-btn-primary ds-btn-lg"
              >
                {m.hero.ctaTrial}
              </LandingAnchor>
              <a href="#produits" className="ds-btn ds-btn-secondary ds-btn-lg">
                {m.hero.ctaPlatform}
              </a>
            </div>
          </div>
          <div className="ds-hero-visual">
            <LandingImage imageKey="hero" priority sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>
        </div>
      </section>

      <section className="ds-trust">
        <div className="ds-container ds-trust-inner">
          {m.trust.items.flatMap((item, index) => {
            const nodes = [
              <span key={item}>{item}</span>,
            ]
            if (index < m.trust.items.length - 1) {
              nodes.push(
                <span key={`dot-${index}`} className="ds-trust-dot" aria-hidden />,
              )
            }
            return nodes
          })}
        </div>
      </section>

      <section id="produits" className="ds-products ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.products.eyebrow}</p>
          <h2>{m.products.title}</h2>
          <p>{m.products.subtitle}</p>
        </div>
        <div className="ds-products-grid">
          {products.map((product) => (
            <article key={product.id} className="ds-product-card">
              <div className={`ds-product-visual ${product.imageKey === "candidat" ? "ds-product-visual--phone" : ""}`}>
                <LandingImageFrame
                  imageKey={product.imageKey}
                  variant="product"
                  zoomable={false}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="ds-product-body">
                <p className="ds-product-eyebrow">{product.subtitle}</p>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <LandingAnchor
                  href={product.href}
                  external={product.external}
                  className="ds-link-arrow"
                >
                  {m.products.learnMore}
                </LandingAnchor>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="ds-features ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.features.eyebrow}</p>
          <h2>{m.features.title}</h2>
          <p>{m.features.subtitle}</p>
        </div>
        <div className="ds-feature-showcase">
          {featureBlocks.map((block) => (
            <article
              key={block.id}
              className={`ds-feature-row ${block.reverse ? "ds-feature-row--reverse" : ""}`}
            >
              <div className="ds-feature-copy">
                <h3>{block.title}</h3>
                <p>{block.description}</p>
              </div>
              <LandingImageFrame
                imageKey={block.imageKey}
                variant="feature"
                sizes="(max-width: 900px) 100vw, 50vw"
              />
            </article>
          ))}
        </div>
        <div className="ds-bento-grid">
          {m.features.bento.map((item, index) => (
            <div
              key={item.id}
              className={`ds-bento-item${index === 0 ? " ds-large" : ""}`}
            >
              <div className="ds-bento-icon" aria-hidden>
                {index === 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ) : index === 1 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12" y2="18" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                )}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-workflow ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.workflow.eyebrow}</p>
          <h2>{m.workflow.title}</h2>
        </div>
        <ol className="ds-workflow-steps">
          {m.workflow.steps.map((step) => (
            <li key={step.step}>
              <span className="ds-step-num">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="ds-pricing ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.pricing.eyebrow}</p>
          <h2>{m.pricing.title}</h2>
          <p>{m.pricing.subtitle}</p>
        </div>

        <div className="ds-pricing-layout">
          <article className="ds-pricing-trial-card">
            <div className="ds-pricing-trial-card__body">
              <span className="ds-pricing-label ds-pricing-label--trial">{m.pricing.trial.tag}</span>
              <h3 className="ds-pricing-trial-card__title">{m.pricing.trial.title}</h3>
              <p className="ds-pricing-trial-card__desc">{m.pricing.trial.calc}</p>
            </div>
            <div className="ds-pricing-trial-card__aside">
              <p className="ds-pricing-trial-card__price">
                {m.pricing.trial.price}
                <span>{m.pricing.currency}</span>
              </p>
              <LandingAnchor
                href={links.backdashSignUp}
                external
                className="ds-btn ds-btn-secondary"
              >
                {m.pricing.trial.cta}
              </LandingAnchor>
            </div>
          </article>

          <div
            className="ds-pricing-period"
            role="group"
            aria-label={`${m.pricing.monthlyLabel} / ${m.pricing.annualLabel}`}
          >
            <button
              type="button"
              className={!paidAnnual ? "is-active" : ""}
              onClick={() => setPaidAnnual(false)}
            >
              {m.pricing.monthlyLabel}
            </button>
            <button
              type="button"
              className={paidAnnual ? "is-active" : ""}
              onClick={() => setPaidAnnual(true)}
            >
              {m.pricing.annualLabel}
              <span className="ds-pricing-period__save">{m.pricing.annualSaveHint}</span>
            </button>
          </div>

          <div className="ds-pricing-cards">
            {paidPlans.map((plan) => {
              const display = formatPaidPlanDisplay(
                plan.pricing,
                paidAnnual,
                m.pricing.periodYear,
                m.pricing.periodMonth,
                m.pricing.annualCalc,
                m.pricing.monthlyCalc,
              )
              return (
                <article
                  key={plan.id}
                  className={`ds-pricing-card-v2 ds-pricing-card-v2--${plan.variant}${plan.primary ? " ds-pricing-card-v2--featured" : ""}`}
                >
                  {plan.primary ? (
                    <span className="ds-pricing-card-v2__ribbon">{m.pricing.recommendedLabel}</span>
                  ) : null}
                  <header className="ds-pricing-card-v2__header">
                    <h3>{plan.tag}</h3>
                    <p>{plan.title}</p>
                  </header>
                  <div className="ds-pricing-card-v2__price">
                    <span className="ds-pricing-card-v2__amount">{display.price}</span>
                    <span className="ds-pricing-card-v2__meta">
                      {m.pricing.currency}
                      {display.period}
                    </span>
                  </div>
                  <p className="ds-pricing-card-v2__note">{display.calc}</p>
                  <div className="ds-pricing-card-v2__divider" aria-hidden />
                  <ul className="ds-pricing-card-v2__list">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span className="ds-pricing-check" aria-hidden>
                          <CheckIcon size={12} />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <LandingAnchor
                    href={links.backdashSignUp}
                    external
                    className={`ds-btn ds-btn-block${plan.primary ? " ds-btn-primary" : " ds-btn-secondary"}`}
                  >
                    {plan.cta}
                  </LandingAnchor>
                </article>
              )
            })}
          </div>

          <article className="ds-pricing-elite-card">
            <div className="ds-pricing-elite-card__copy">
              <span className="ds-pricing-label ds-pricing-label--elite">{m.pricing.elite.title}</span>
              <p>{m.pricing.elite.calc}</p>
              <ul className="ds-pricing-elite-card__list">
                {m.pricing.elite.features.map((feature) => (
                  <li key={feature}>
                    <span className="ds-pricing-check ds-pricing-check--muted" aria-hidden>
                      <CheckIcon size={12} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ds-pricing-elite-card__action">
              <p className="ds-pricing-elite-card__price">{m.pricing.elite.priceLabel}</p>
              <LandingAnchor href="#contact" className="ds-btn ds-btn-secondary">
                {m.pricing.elite.cta}
              </LandingAnchor>
            </div>
          </article>
        </div>
      </section>

      <section id="faq" className="ds-faq ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.faq.eyebrow}</p>
          <h2>{m.faq.title}</h2>
        </div>
        <div className="ds-faq-list">
          {m.faq.items.map((item, index) => {
            const open = openFaq === index
            return (
              <div key={item.q} className={`ds-faq-item ${open ? "ds-faq-item--open" : ""}`}>
                <button
                  type="button"
                  className="ds-faq-question"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : index)}
                >
                  {item.q}
                  <span className="ds-faq-chevron" aria-hidden />
                </button>
                {open ? <p className="ds-faq-answer">{item.a}</p> : null}
              </div>
            )
          })}
        </div>
      </section>

      <section id="contact" className="ds-contact ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">{m.contact.eyebrow}</p>
          <h2>{m.contact.title}</h2>
          <p>
            {m.contact.introBeforeEmail}{" "}
            <ContactEmail className="ds-contact-email-link" />{" "}
            {m.contact.introAfterEmail}
          </p>
        </div>
        <div className="ds-contact-card">
          <ContactForm />
        </div>
      </section>

      <section className="ds-cta-band">
        <div className="ds-container ds-cta-band-inner">
          <div>
            <h2>{m.cta.title}</h2>
            <p>{m.cta.subtitle}</p>
          </div>
          <LandingAnchor
            href={links.backdashSignUp}
            external
            className="ds-btn ds-btn-white ds-btn-lg"
          >
            {m.cta.button}
          </LandingAnchor>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
