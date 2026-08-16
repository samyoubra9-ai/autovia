"use client"

import Image from "next/image"
import { useCallback, useEffect, useId, useState } from "react"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"

import { LANDING_IMAGE_PATHS, type LandingImageKey } from "./landing-data"

type LandingImageFrameProps = {
  imageKey: LandingImageKey
  priority?: boolean
  sizes?: string
  /** hero = grande capture accueil, feature = blocs fonctionnalités, product = cartes produits */
  variant?: "hero" | "feature" | "product"
  /** Lightbox au clic — désactivé sur les cartes produits */
  zoomable?: boolean
}

export function LandingImageFrame({
  imageKey,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  variant = "feature",
  zoomable = true,
}: LandingImageFrameProps) {
  const m = useVitrineMessages()
  const img = LANDING_IMAGE_PATHS[imageKey]
  const alt = m.images[imageKey]
  const src = img.src
  const [open, setOpen] = useState(false)
  const titleId = useId()

  const close = useCallback(() => setOpen(false), [])
  const openLightbox = useCallback(() => setOpen(true), [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  const frameClass = `ds-landing-image-frame ds-landing-image-frame--${variant}${zoomable ? "" : " ds-landing-image-frame--static"}`

  const image = (
    <Image
      src={src}
      alt={alt}
      width={img.width}
      height={img.height}
      className="ds-landing-shot"
      priority={priority}
      sizes={sizes}
      unoptimized
    />
  )

  if (!zoomable) {
    return <div className={frameClass}>{image}</div>
  }

  return (
    <>
      <button
        type="button"
        className={frameClass}
        onClick={openLightbox}
        aria-label={m.images.zoomOpen}
      >
        {image}
        <span className="ds-landing-image-frame-hint" aria-hidden>
          <ZoomIcon />
          {m.images.zoomHint}
        </span>
      </button>

      {open ? (
        <div
          className="ds-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="ds-lightbox-backdrop"
            aria-label={m.images.zoomClose}
            onClick={close}
          />
          <div className="ds-lightbox-panel">
            <div className="ds-lightbox-head">
              <p id={titleId} className="ds-lightbox-title">
                {alt}
              </p>
              <button
                type="button"
                className="ds-lightbox-close"
                aria-label={m.images.zoomClose}
                onClick={close}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ds-lightbox-body">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} className="ds-lightbox-img" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function ZoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  )
}
