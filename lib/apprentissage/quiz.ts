import type { TrackQuizQuestion } from "@/lib/apprentissage/quiz-types"

const FALLBACK_DISTRACTORS = [
  "Panneau de danger",
  "Panneau d'interdiction",
  "Panneau d'obligation",
  "Panneau d'indication",
  "Panneau de priorité",
  "Marquage au sol",
] as const

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase()
}

/** Garde des propositions toutes différentes (comparaison insensible à la casse). */
export function dedupeQuizOptions(
  options: { id: string; label: string }[],
  correctOptionId: string,
): { id: string; label: string }[] {
  const correct = options.find((o) => o.id === correctOptionId)
  if (!correct?.label.trim()) return []

  const seen = new Set<string>()
  const unique: { id: string; label: string }[] = []

  const tryPush = (option: { id: string; label: string }) => {
    const label = option.label.trim()
    const key = normalizeLabel(label)
    if (!label || seen.has(key)) return
    seen.add(key)
    unique.push({ id: option.id, label })
  }

  tryPush(correct)
  for (const option of options) {
    if (option.id === correctOptionId) continue
    tryPush(option)
  }

  return unique.length >= 2 ? unique : []
}

export function prepareQuizQuestion(
  question: TrackQuizQuestion,
): TrackQuizQuestion | null {
  const uniqueOptions = dedupeQuizOptions(
    question.options,
    question.correctOptionId,
  )
  if (uniqueOptions.length < 2) return null
  if (!uniqueOptions.some((o) => o.id === question.correctOptionId)) {
    return null
  }

  return {
    ...question,
    options: shuffle(uniqueOptions),
    explanation: question.explanation.trim(),
  }
}

/** Prépare une session figée : options uniques, ordre mélangé une seule fois. */
export function prepareQuizSession(
  questions: TrackQuizQuestion[],
): TrackQuizQuestion[] {
  return questions
    .map(prepareQuizQuestion)
    .filter((q): q is TrackQuizQuestion => q !== null)
}

export function computeQuizScore(
  questions: TrackQuizQuestion[],
  answers: Record<string, string>,
): number {
  if (questions.length === 0) return 0
  const correct = questions.filter(
    (q) => answers[q.id] === q.correctOptionId,
  ).length
  return Math.round((correct / questions.length) * 100)
}

export function getOptionLabel(
  question: TrackQuizQuestion,
  optionId: string | undefined,
): string | null {
  if (!optionId) return null
  return question.options.find((o) => o.id === optionId)?.label ?? null
}

export function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

export function pickDistinctWrongLabels(
  correctName: string,
  poolNames: string[],
  count: number,
): string[] {
  const seen = new Set([normalizeLabel(correctName)])
  const wrong: string[] = []

  const tryAdd = (label: string) => {
    const trimmed = label.trim()
    const key = normalizeLabel(trimmed)
    if (!trimmed || seen.has(key)) return false
    seen.add(key)
    wrong.push(trimmed)
    return wrong.length >= count
  }

  for (const name of shuffle(poolNames)) {
    if (tryAdd(name)) return wrong
  }

  for (const distractor of shuffle([...FALLBACK_DISTRACTORS])) {
    if (tryAdd(distractor)) return wrong
  }

  return wrong
}
