export type TrackQuizQuestion = {
  id: string
  prompt: string
  image?: string | null
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
}
