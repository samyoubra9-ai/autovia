import type { VitrineMessages } from "@/lib/i18n/vitrine-messages"

import {
  PRODUCT_CARD_IMAGE_KEYS,
  type LandingImageKey,
} from "./landing-data"

/** URLs injectées depuis le serveur (lib/app-urls + .env). */
export type LandingLinks = {
  /** NEXT_PUBLIC_BACKDASH_URL + /sign-in */
  backdashSignIn: string
  /** NEXT_PUBLIC_BACKDASH_URL + /sign-up */
  backdashSignUp: string
  /** NEXT_PUBLIC_CANDIDAT_URL — saisie du code candidat */
  candidatUrl: string
  /** Installateur Windows (.exe) sur le site ou URL externe */
  backdashDesktopDownload: string
  /** true si le fichier est réellement téléchargeable */
  backdashDesktopDownloadReady: boolean
}

const PRODUCT_HREFS: Record<
  "backdash" | "candidat" | "platform",
  (links: LandingLinks) => { href: string; external: boolean }
> = {
  backdash: (links) => ({ href: links.backdashSignIn, external: true }),
  candidat: (links) => ({ href: links.candidatUrl, external: true }),
  platform: (links) => ({ href: links.backdashSignUp, external: true }),
}

export function buildProductCards(
  links: LandingLinks,
  cards: VitrineMessages["products"]["cards"],
) {
  return cards.map((card) => {
    const id = card.id as keyof typeof PRODUCT_CARD_IMAGE_KEYS
    const link = PRODUCT_HREFS[id](links)
    return {
      id: card.id,
      title: card.title,
      subtitle: card.subtitle,
      description: card.description,
      imageKey: PRODUCT_CARD_IMAGE_KEYS[id] as LandingImageKey,
      href: link.href,
      external: link.external,
    }
  })
}
