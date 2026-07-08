export const TRACK_SLUGS = ["panneaux", "intersections"] as const
export type TrackSlug = (typeof TRACK_SLUGS)[number]

export type PanneauSign = {
  id: string
  name: string
  meaning: string
  image: string
}

export type PanneauSection = {
  slug: string
  title: string
  description: string
  signs: PanneauSign[]
}

export type PanneauCategory = {
  slug: string
  title: string
  description: string
  signs?: PanneauSign[]
  sections?: PanneauSection[]
}

export type PanneauFamily = {
  slug: "vertical" | "horizontal" | "lumineuse" | "agent-ordre"
  title: string
  description: string
  /** Catégories (signalisation verticale). */
  categories?: PanneauCategory[]
  /** Fiches sans sous-catégories (horizontale, lumineuse, agents…). */
  signs?: PanneauSign[]
}

export type PanneauxTrack = {
  slug: "panneaux"
  title: string
  description: string
  quiz: { passPercent: number; questionsPerRound: number }
  families: PanneauFamily[]
}

export type IntersectionSign = {
  name: string
  image: string
}

export type IntersectionScenarioVehicle = {
  /** Couleur du véhicule sur le schéma (rouge, bleu, vert, jaune, orange, violet, noir, blanc). */
  color: "red" | "blue" | "green" | "yellow" | "orange" | "purple" | "black" | "white"
  /** Libellé affiché (ex. « Véhicule B »). Si vide, le libellé par défaut de la couleur est utilisé. */
  label?: string
}

export type IntersectionScenario = {
  image: string
  caption: string
  /**
   * Ordre de passage par étapes.
   * Chaque étape = un véhicule seul, ou un tableau de véhicules qui passent en même temps.
   */
  passingOrder?: (
    | IntersectionScenarioVehicle
    | IntersectionScenarioVehicle[]
  )[]
}

export type IntersectionGroup = {
  slug: string
  title: string
  description: string
}

export type IntersectionType = {
  slug: string
  group: string
  title: string
  summary: string
  body: string
  sign?: IntersectionSign | null
  scenario?: IntersectionScenario | null
  rules: string[]
}

export type IntersectionQuizQuestion = {
  id: string
  prompt: string
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
}

export type IntersectionsTrack = {
  slug: "intersections"
  title: string
  description: string
  quiz: { passPercent: number; questionsPerRound: number }
  groups: IntersectionGroup[]
  types: IntersectionType[]
  quizQuestions: IntersectionQuizQuestion[]
}

export type SignQuizQuestion = {
  id: string
  signKey: string
  categorySlug: string
  signId: string
  image: string
  prompt: string
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
}

export type TrackProgress = {
  signsStudied: string[]
  categoriesCompleted: string[]
  quizBestScore: number | null
  quizPassed: boolean
}

export type IntersectionsProgress = {
  typesStudied: string[]
  quizBestScore: number | null
  quizPassed: boolean
}

export type ApprentissageProgress = {
  version: 3
  panneaux: TrackProgress
  intersections: IntersectionsProgress
  updatedAt: string
}

export const QUIZ_PASS_THRESHOLD_PERCENT = 80

export function signKey(
  categorySlug: string,
  signId: string,
  sectionSlug?: string,
) {
  if (sectionSlug && sectionSlug !== "debut") {
    return `${categorySlug}:${sectionSlug}:${signId}`
  }
  return `${categorySlug}:${signId}`
}

export function sectionProgressKey(categorySlug: string, sectionSlug: string) {
  return `${categorySlug}:${sectionSlug}`
}
