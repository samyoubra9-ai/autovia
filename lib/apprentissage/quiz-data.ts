import quizFr from "@/messages/quiz-fr.json"
import quizKab from "@/messages/quiz-kab.json"
import quizAr from "@/messages/quiz-ar.json"

import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

import type { ModuleSlug } from "./types"

export type QuizOptionData = {
  id: string
  label: string
}

export type QuizQuestionData = {
  id: string
  prompt: string
  options: QuizOptionData[]
  correctOptionId: string
  explanation: string
}

type QuizCatalog = {
  modules: Record<
    string,
    {
      questions: QuizQuestionData[]
    }
  >
}

const catalogs: Record<VitrineLocale, QuizCatalog> = {
  fr: quizFr as QuizCatalog,
  kab: quizKab as QuizCatalog,
  ar: quizAr as QuizCatalog,
}

function isEmptyString(value: unknown): value is "" {
  return typeof value === "string" && value.trim() === ""
}

function mergeQuestion(
  localeQ: QuizQuestionData | undefined,
  frQ: QuizQuestionData,
): QuizQuestionData {
  if (!localeQ) return frQ

  return {
    id: frQ.id,
    prompt: isEmptyString(localeQ.prompt) ? frQ.prompt : localeQ.prompt,
    correctOptionId: frQ.correctOptionId,
    explanation: isEmptyString(localeQ.explanation)
      ? frQ.explanation
      : localeQ.explanation,
    options: frQ.options.map((opt, i) => {
      const localeOpt = localeQ.options[i]
      return {
        id: opt.id,
        label:
          localeOpt && !isEmptyString(localeOpt.label)
            ? localeOpt.label
            : opt.label,
      }
    }),
  }
}

const QUIZ_MODULE_ALIASES: Partial<Record<ModuleSlug, string>> = {
  "chapitre-1": "fondamentaux",
}

export function getQuizQuestionsForModule(
  moduleSlug: ModuleSlug,
  locale: VitrineLocale = "fr",
): QuizQuestionData[] {
  const resolved = QUIZ_MODULE_ALIASES[moduleSlug] ?? moduleSlug
  const frQuestions = catalogs.fr.modules[resolved]?.questions ?? []
  if (locale === "fr") return frQuestions

  const localeQuestions = catalogs[locale].modules[resolved]?.questions ?? []
  return frQuestions.map((frQ, index) =>
    mergeQuestion(localeQuestions[index], frQ),
  )
}

export function getQuizQuestionCount(moduleSlug: ModuleSlug): number {
  const resolved = QUIZ_MODULE_ALIASES[moduleSlug] ?? moduleSlug
  return catalogs.fr.modules[resolved]?.questions.length ?? 0
}
