/** Chemins des visuels — remplacez les fichiers dans /public/landing/ (même nom). */
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
    src: "/landing/planning2.png",
    width: 1200,
    height: 750,
  },
  eleves: {
    src: "/landing/tresorerie2.png",
    width: 1200,
    height: 750,
  },
  listeExamen: {
    src: "/landing/impression2.png",
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
