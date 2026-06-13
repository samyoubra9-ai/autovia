"use client"

import { useState, type ReactNode } from "react"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { formatVitrineMessage } from "@/lib/i18n/vitrine-messages"
import { SUBSCRIPTION_PRICING, formatDzdAmount } from "@/lib/subscription-plans"

import { LandingImageFrame } from "./landing/LandingImageFrame"
import { FEATURE_BLOCK_IMAGE_BY_ID } from "./landing/landing-data"
import { ContactForm } from "./landing/ContactForm"
import { ContactEmail } from "./landing/ContactEmail"
import { LandingFooter } from "./landing/LandingFooter"
import { LandingNav } from "./landing/LandingNav"
import { buildProductCards, type LandingLinks } from "./landing/landing-links"

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

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
  const [essentielAnnual, setEssentielAnnual] = useState(true)
  const [proAnnual, setProAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const essentiel = SUBSCRIPTION_PRICING.ESSENTIEL
  const pro = SUBSCRIPTION_PRICING.PRO

  const essentielPrice = essentielAnnual
    ? formatDzdAmount(essentiel.annualDzd).replace(" DZD", "")
    : formatDzdAmount(essentiel.monthlyDzd).replace(" DZD", "")
  const essentielPeriod = essentielAnnual ? m.pricing.periodYear : m.pricing.periodMonth
  const essentielCalc = essentielAnnual
    ? formatVitrineMessage(m.pricing.annualCalc, {
        monthlyEquivalent: formatDzdAmount(Math.round(essentiel.annualDzd / 12)),
        savings: formatDzdAmount(essentiel.annualSavingsVsMonthlyDzd),
      })
    : formatVitrineMessage(m.pricing.monthlyCalc, {
        annualTotal: formatDzdAmount(essentiel.annualFromMonthlyDzd),
      })

  const proPrice = proAnnual
    ? formatDzdAmount(pro.annualDzd).replace(" DZD", "")
    : formatDzdAmount(pro.monthlyDzd).replace(" DZD", "")
  const proPeriod = proAnnual ? m.pricing.periodYear : m.pricing.periodMonth
  const proCalc = proAnnual
    ? formatVitrineMessage(m.pricing.annualCalc, {
        monthlyEquivalent: formatDzdAmount(Math.round(pro.annualDzd / 12)),
        savings: formatDzdAmount(pro.annualSavingsVsMonthlyDzd),
      })
    : formatVitrineMessage(m.pricing.monthlyCalc, {
        annualTotal: formatDzdAmount(pro.annualFromMonthlyDzd),
      })

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
            <LandingImageFrame imageKey="hero" variant="hero" priority sizes="(max-width: 1024px) 100vw, 60vw" />
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

        <div className="ds-pricing-grid ds-pricing-grid--wide">
          <div className="ds-pricing-card ds-pricing-card--trial">
            <div className="ds-trial-tag">{m.pricing.trial.tag}</div>
            <div className="ds-price-header">
              <h3>{m.pricing.trial.title}</h3>
              <div className="ds-price-amount ds-price-amount--trial">
                <span>{m.pricing.trial.price}</span>
                <span className="ds-price-currency">{m.pricing.currency}</span>
              </div>
              <div className="ds-price-calc ds-price-calc--muted">
                {m.pricing.trial.calc}
              </div>
            </div>

            <ul className="ds-feature-list">
              {m.pricing.trial.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon /> {feature}
                </li>
              ))}
            </ul>

            <LandingAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-secondary ds-btn-lg ds-btn-block"
            >
              {m.pricing.trial.cta}
            </LandingAnchor>
          </div>

          <div className="ds-pricing-card">
            <div className="ds-popular-tag ds-popular-tag--essentiel">{m.pricing.essentiel.tag}</div>
            <div className="ds-billing-toggle ds-billing-toggle--inline">
              <span>{m.pricing.monthlyLabel}</span>
              <button
                type="button"
                className={`ds-toggle-switch ${essentielAnnual ? "ds-annual" : ""}`}
                onClick={() => setEssentielAnnual((v) => !v)}
                aria-label={essentielAnnual ? m.pricing.toggleToMonthly : m.pricing.toggleToAnnual}
              />
              <span>
                {m.pricing.annualLabel}{" "}
                <span className="ds-save-badge">
                  −{formatDzdAmount(essentiel.annualSavingsVsMonthlyDzd).replace(" DZD", "")}
                </span>
              </span>
            </div>
            <div className="ds-price-header">
              <h3>{m.pricing.essentiel.title}</h3>
              <div className="ds-price-amount">
                <span>{essentielPrice}</span>
                <span className="ds-price-currency">{m.pricing.currency}</span>
                <span className="ds-price-period">{essentielPeriod}</span>
              </div>
              <div className="ds-price-calc">{essentielCalc}</div>
            </div>

            <ul className="ds-feature-list">
              {m.pricing.essentiel.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon /> {feature}
                </li>
              ))}
            </ul>

            <LandingAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-secondary ds-btn-lg ds-btn-block"
            >
              {m.pricing.essentiel.cta}
            </LandingAnchor>
          </div>

          <div className="ds-pricing-card ds-popular">
            <div className="ds-popular-tag">{m.pricing.pro.tag}</div>
            <div className="ds-billing-toggle ds-billing-toggle--inline">
              <span>{m.pricing.monthlyLabel}</span>
              <button
                type="button"
                className={`ds-toggle-switch ${proAnnual ? "ds-annual" : ""}`}
                onClick={() => setProAnnual((v) => !v)}
                aria-label={proAnnual ? m.pricing.toggleToMonthly : m.pricing.toggleToAnnual}
              />
              <span>
                {m.pricing.annualLabel}{" "}
                <span className="ds-save-badge">
                  −{formatDzdAmount(pro.annualSavingsVsMonthlyDzd).replace(" DZD", "")}
                </span>
              </span>
            </div>
            <div className="ds-price-header">
              <h3>{m.pricing.pro.title}</h3>
              <div className="ds-price-amount">
                <span>{proPrice}</span>
                <span className="ds-price-currency">{m.pricing.currency}</span>
                <span className="ds-price-period">{proPeriod}</span>
              </div>
              <div className="ds-price-calc">{proCalc}</div>
            </div>

            <ul className="ds-feature-list">
              {m.pricing.pro.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon /> {feature}
                </li>
              ))}
            </ul>

            <LandingAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-primary ds-btn-lg ds-btn-block"
            >
              {m.pricing.pro.cta}
            </LandingAnchor>
          </div>

          <div className="ds-pricing-card ds-pricing-card--elite">
            <div className="ds-price-header">
              <h3>{m.pricing.elite.title}</h3>
              <div className="ds-price-amount ds-price-amount--elite">
                <span>{m.pricing.elite.priceLabel}</span>
              </div>
              <div className="ds-price-calc ds-price-calc--muted">
                {m.pricing.elite.calc}
              </div>
            </div>

            <ul className="ds-feature-list">
              {m.pricing.elite.features.map((feature) => (
                <li key={feature}>
                  <CheckIcon /> {feature}
                </li>
              ))}
            </ul>

            <LandingAnchor href="#contact" className="ds-btn ds-btn-secondary ds-btn-lg ds-btn-block">
              {m.pricing.elite.cta}
            </LandingAnchor>
          </div>
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
