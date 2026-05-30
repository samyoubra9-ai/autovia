"use client"

import Image from "next/image"
import { useState, type ReactNode } from "react"

import { LandingImage } from "./landing/LandingImage"
import {
  FAQ_ITEMS,
  FEATURE_BLOCKS,
  HERO_BULLETS,
  WORKFLOW_STEPS,
} from "./landing/landing-data"
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
  const products = buildProductCards(links)
  const [isAnnual, setIsAnnual] = useState(true)
  const [priceFade, setPriceFade] = useState(1)
  const [priceValue, setPriceValue] = useState("12 000")
  const [pricePeriod, setPricePeriod] = useState("/ an")
  const [priceCalcText, setPriceCalcText] = useState(
    "Soit 1 000 DZD / mois. Vous économisez 2 400 DZD !",
  )
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const togglePlan = () => {
    setPriceFade(0)
    const next = !isAnnual
    window.setTimeout(() => {
      if (next) {
        setPriceValue("12 000")
        setPricePeriod("/ an")
        setPriceCalcText("Soit 1 000 DZD / mois. Vous économisez 2 400 DZD !")
      } else {
        setPriceValue("1 200")
        setPricePeriod("/ mois")
        setPriceCalcText("Facturé mensuellement (14 400 DZD / an au total).")
      }
      setIsAnnual(next)
      setPriceFade(1)
    }, 150)
  }

  return (
    <div className="ds-landing-page">
      <LandingNav links={links} />

      <section className="ds-hero">
        <div className="ds-container ds-hero-grid">
          <div className="ds-hero-copy">
            <span className="ds-badge">Auto-écoles en Algérie 🇩🇿</span>
            <h1>
              Le SaaS qui simplifie la gestion de votre auto-école
            </h1>
            <p className="ds-hero-lead">
              Plannings, candidats, paiements, listes d&apos;examen et suivi mobile — une
              plateforme claire pour votre équipe et vos élèves.
            </p>
            <ul className="ds-hero-bullets">
              {HERO_BULLETS.map((item) => (
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
                Essai gratuit
              </LandingAnchor>
              <a href="#produits" className="ds-btn ds-btn-secondary ds-btn-lg">
                Voir la plateforme
              </a>
            </div>
          </div>
          <div className="ds-hero-visual">
            <div className="ds-browser-frame ds-browser-frame--hero">
              <LandingImage imageKey="hero" priority sizes="(max-width: 1024px) 100vw, 60vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="ds-trust">
        <div className="ds-container ds-trust-inner">
          <span>Conçu pour les professionnels de la conduite</span>
          <span className="ds-trust-dot" aria-hidden />
          <span>Interface en français</span>
          <span className="ds-trust-dot" aria-hidden />
          <span>Listes d&apos;examen & suivi QR</span>
        </div>
      </section>

      <section id="produits" className="ds-products ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">Écosystème</p>
          <h2>Un seul abonnement, trois espaces</h2>
          <p>
            Autovia pour l&apos;auto-école, portail candidat pour les élèves, et ce site pour
            découvrir le service.
          </p>
        </div>
        <div className="ds-products-grid">
          {products.map((product) => (
            <article key={product.id} className="ds-product-card">
              <div className={`ds-product-visual ${product.imageKey === "candidat" ? "ds-product-visual--phone" : ""}`}>
                <LandingImage
                  imageKey={product.imageKey}
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
                  En savoir plus →
                </LandingAnchor>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="ds-features ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">Fonctionnalités</p>
          <h2>Tout le métier, sans complexité</h2>
          <p>Des écrans pensés pour le quotidien des auto-écoles algériennes.</p>
        </div>
        <div className="ds-feature-showcase">
          {FEATURE_BLOCKS.map((block) => (
            <article
              key={block.title}
              className={`ds-feature-row ${block.reverse ? "ds-feature-row--reverse" : ""}`}
            >
              <div className="ds-feature-copy">
                <h3>{block.title}</h3>
                <p>{block.description}</p>
              </div>
              <div
                className={`ds-browser-frame ds-browser-frame--flat${
                  block.imageKey === "planning" ||
                  block.imageKey === "eleves" ||
                  block.imageKey === "listeExamen"
                    ? " ds-browser-frame--clean"
                    : ""
                }`}
              >
                <LandingImage imageKey={block.imageKey} sizes="(max-width: 900px) 100vw, 50vw" />
              </div>
            </article>
          ))}
        </div>
        <div className="ds-bento-grid">
          <div className="ds-bento-item ds-large">
            <div className="ds-bento-icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Données isolées par auto-école</h3>
            <p>Chaque établissement dispose de son espace sécurisé. Vos candidats et paiements restent confidentiels.</p>
          </div>
          <div className="ds-bento-item">
            <div className="ds-bento-icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18" />
              </svg>
            </div>
            <h3>Utilisable sur mobile</h3>
            <p>Consultez le planning et les fiches depuis un téléphone ou une tablette.</p>
          </div>
          <div className="ds-bento-item">
            <div className="ds-bento-icon" aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Statistiques en temps réel</h3>
            <p>Tableau de bord : inscriptions, séances du mois, examens à venir, encaissements.</p>
          </div>
        </div>
      </section>

      <section className="ds-workflow ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">Mise en route</p>
          <h2>Opérationnel en trois étapes</h2>
        </div>
        <ol className="ds-workflow-steps">
          {WORKFLOW_STEPS.map((step) => (
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
          <p className="ds-eyebrow">Tarifs</p>
          <h2>Un tarif simple, sans surprise</h2>
          <p>Accès complet à toutes les fonctionnalités pour votre auto-école.</p>
        </div>

        <div className="ds-pricing-grid">
          <div className="ds-pricing-card ds-pricing-card--trial">
            <div className="ds-trial-tag">Essai gratuit</div>
            <div className="ds-price-header">
              <h3>Découverte</h3>
              <div className="ds-price-amount ds-price-amount--trial">
                <span>0</span>
                <span className="ds-price-currency">DZD</span>
              </div>
              <div className="ds-price-calc ds-price-calc--muted">
                15 jours · jusqu&apos;à 10 élèves · sans carte bancaire
              </div>
            </div>

            <ul className="ds-feature-list">
              <li><CheckIcon /> Jusqu&apos;à 10 élèves</li>
              <li><CheckIcon /> Tableau de bord complet</li>
              <li><CheckIcon /> Paiements & plannings</li>
              <li><CheckIcon /> Listes d&apos;examen</li>
            </ul>

            <LandingAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-secondary ds-btn-lg ds-btn-block"
            >
              Essai gratuit
            </LandingAnchor>
          </div>

          <div className="ds-pricing-card ds-popular">
            <div className="ds-popular-tag">Autovia Pro</div>
            <div className="ds-billing-toggle ds-billing-toggle--inline">
              <span>Mensuel</span>
              <button
                type="button"
                className={`ds-toggle-switch ${isAnnual ? "ds-annual" : ""}`}
                onClick={togglePlan}
                aria-label={isAnnual ? "Basculer vers mensuel" : "Basculer vers annuel"}
              />
              <span>
                Annuel <span className="ds-save-badge">2 MOIS OFFERTS</span>
              </span>
            </div>
            <div className="ds-price-header">
              <h3>Accès complet</h3>
              <div className="ds-price-amount">
                <span style={{ opacity: priceFade, transition: "opacity 0.15s ease" }}>
                  {priceValue}
                </span>
                <span className="ds-price-currency">DZD</span>
                <span className="ds-price-period" style={{ opacity: priceFade, transition: "opacity 0.15s ease" }}>
                  {pricePeriod}
                </span>
              </div>
              <div className="ds-price-calc" style={{ opacity: priceFade, transition: "opacity 0.15s ease" }}>
                {priceCalcText}
              </div>
            </div>

            <ul className="ds-feature-list">
              <li><CheckIcon /> Candidats illimités</li>
              <li><CheckIcon /> Plannings & moniteurs</li>
              <li><CheckIcon /> Paiements & reçus</li>
              <li><CheckIcon /> Listes d&apos;examen & impression</li>
              <li><CheckIcon /> Portail candidat (QR)</li>
              <li><CheckIcon /> Support prioritaire</li>
            </ul>

            <LandingAnchor
              href={links.backdashSignUp}
              external
              className="ds-btn ds-btn-primary ds-btn-lg ds-btn-block"
            >
              Créer mon compte
            </LandingAnchor>
          </div>
        </div>
      </section>

      <section id="faq" className="ds-faq ds-container">
        <div className="ds-section-header">
          <p className="ds-eyebrow">FAQ</p>
          <h2>Questions fréquentes</h2>
        </div>
        <div className="ds-faq-list">
          {FAQ_ITEMS.map((item, index) => {
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

      <section className="ds-cta-band">
        <div className="ds-container ds-cta-band-inner">
          <div>
            <h2>Prêt à moderniser votre auto-école ?</h2>
            <p>Rejoignez Autovia et centralisez votre gestion dès aujourd&apos;hui.</p>
          </div>
          <LandingAnchor
            href={links.backdashSignUp}
            external
            className="ds-btn ds-btn-white ds-btn-lg"
          >
            Commencer gratuitement
          </LandingAnchor>
        </div>
      </section>

      <footer className="ds-footer">
        <div className="ds-container ds-footer-inner">
          <a href="/" className="ds-logo">
            <Image
              src="/brand/favicon/favicon-96x96.png"
              alt=""
              width={28}
              height={28}
              className="ds-logo-img"
            />
            Auto<span>via</span>
          </a>
          <p>&copy; {new Date().getFullYear()} Autovia — Auto-écoles en Algérie.</p>
        </div>
      </footer>
    </div>
  )
}
