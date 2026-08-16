/** Chemins des visuels — déposez vos captures dans /public/landing/ (voir README.md). */
export const LANDING_IMAGE_PATHS = {
  hero: {
    src: "/landing/headimage.png",
    width: 1280,
    height: 800,
  },
  backdash: {
    src: "/landing/espaceauto.png",
    width: 1200,
    height: 750,
  },
  planning: {
    src: "/landing/planning.png",
    width: 1200,
    height: 750,
  },
  eleves: {
    src: "/landing/tresorerie.png",
    width: 1200,
    height: 750,
  },
  listeExamen: {
    src: "/landing/impression.png",
    width: 1200,
    height: 750,
  },
  candidat: {
    src: "/landing/pwa.png",
    width: 390,
    height: 844,
  },
} as const

export type LandingImageKey = keyof typeof LANDING_IMAGE_PATHS

/** @deprecated Utiliser LANDING_IMAGE_PATHS + messages/images */
export const LANDING_IMAGES = LANDING_IMAGE_PATHS

/** Blocs « Fonctionnalités » — clé = id du bloc dans messages/fr.json */
export const FEATURE_BLOCK_IMAGE_BY_ID: Record<
  "planning" | "eleves" | "listeExamen",
  LandingImageKey
> = {
  planning: "planning",
  eleves: "eleves",
  listeExamen: "listeExamen",
}

export const FEATURE_BLOCK_IMAGE_KEYS = [
  "planning",
  "eleves",
  "listeExamen",
] as const satisfies readonly LandingImageKey[]

export const PRODUCT_CARD_IMAGE_KEYS: Record<
  "backdash" | "candidat" | "platform",
  LandingImageKey
> = {
  backdash: "backdash",
  candidat: "candidat",
  platform: "hero",
}
