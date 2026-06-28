export const TRACK_SLUGS = ["panneaux", "intersections"] as const
export type TrackSlug = (typeof TRACK_SLUGS)[number]

export type PanneauSign = {
  id: string
  name: string
  meaning: string
  image: string
}

export type PanneauCategory = {
  slug: string
  title: string
  description: string
  signs: PanneauSign[]
}

export type PanneauxTrack = {
  slug: "panneaux"
  title: string
  description: string
  quiz: { passPercent: number; questionsPerRound: number }
  categories: PanneauCategory[]
}

export type IntersectionType = {
  slug: string
  title: string
  summary: string
  body: string
  image: string | null
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

export function signKey(categorySlug: string, signId: string) {
  return `${categorySlug}:${signId}`
}
