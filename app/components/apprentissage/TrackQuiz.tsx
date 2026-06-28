"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  Check,
  Circle,
  RotateCcw,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVitrineLocale } from "@/app/components/vitrine/VitrineLocaleProvider"
import {
  formatApprentissageMessage,
  getApprentissageMessages,
} from "@/lib/i18n/apprentissage-messages"
import { cn } from "@/lib/utils"

export type TrackQuizQuestion = {
  id: string
  prompt: string
  image?: string | null
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
}

type QuizPhase = "intro" | "playing" | "results"

type TrackQuizProps = {
  questions: TrackQuizQuestion[]
  passPercent: number
  backHref: string
  continueHref?: string
  onComplete: (scorePercent: number) => void
}

function computeScore(
  questions: TrackQuizQuestion[],
  answers: Record<string, string>,
): number {
  if (questions.length === 0) return 0
  const correct = questions.filter(
    (q) => answers[q.id] === q.correctOptionId,
  ).length
  return Math.round((correct / questions.length) * 100)
}

export function TrackQuiz({
  questions,
  passPercent,
  backHref,
  continueHref,
  onComplete,
}: TrackQuizProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)

  const [phase, setPhase] = useState<QuizPhase>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [scoreSaved, setScoreSaved] = useState(false)

  const current = questions[currentIndex]
  const total = questions.length
  const selectedId = current ? answers[current.id] : undefined
  const isLast = currentIndex === total - 1

  const score = useMemo(
    () => computeScore(questions, answers),
    [questions, answers],
  )
  const passed = score >= passPercent

  function startQuiz() {
    setPhase("playing")
    setCurrentIndex(0)
    setAnswers({})
    setScoreSaved(false)
  }

  function selectOption(optionId: string) {
    if (!current) return
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }))
  }

  function goNext() {
    if (!selectedId) return
    if (isLast) {
      const finalScore = computeScore(questions, answers)
      if (!scoreSaved) {
        onComplete(finalScore)
        setScoreSaved(true)
      }
      setPhase("results")
      return
    }
    setCurrentIndex((i) => i + 1)
  }

  if (total === 0) {
    return (
      <div className="ap-quiz-empty">
        <p>{m.quiz.noQuestions}</p>
        <Button asChild variant="outline">
          <Link href={backHref}>{m.quiz.backToModule}</Link>
        </Button>
      </div>
    )
  }

  if (phase === "intro") {
    return (
      <div className="ap-quiz-intro">
        <p className="ap-quiz-intro-text">{m.quiz.intro}</p>
        <ul className="ap-quiz-intro-list">
          <li>
            {formatApprentissageMessage(m.quiz.questionCount, { count: total })}
          </li>
          <li>
            {formatApprentissageMessage(m.quiz.passRequirement, {
              score: passPercent,
            })}
          </li>
          <li>{m.quiz.correctionAtEnd}</li>
        </ul>
        <Button type="button" size="lg" onClick={startQuiz} className="gap-2">
          {m.quiz.start}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    )
  }

  if (phase === "playing" && current) {
    return (
      <div className="ap-quiz-play">
        <div className="ap-quiz-play-head">
          <span className="ap-quiz-play-step">
            {formatApprentissageMessage(m.quiz.questionOf, {
              current: currentIndex + 1,
              total,
            })}
          </span>
          <div className="ap-quiz-play-progress">
            <div
              className="ap-progress-fill"
              style={{
                width: `${((currentIndex + (selectedId ? 1 : 0)) / total) * 100}%`,
              }}
            />
          </div>
        </div>

        {current.image ? (
          <div className="ap-sign-quiz-image-wrap">
            <Image
              src={current.image}
              alt=""
              width={160}
              height={160}
              className="ap-sign-quiz-image"
              unoptimized
            />
          </div>
        ) : null}

        <h2 className="ap-quiz-prompt">{current.prompt}</h2>

        <div className="ap-quiz-options" role="radiogroup" aria-label={current.prompt}>
          {current.options.map((opt) => {
            const checked = selectedId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                className={cn(
                  "ap-quiz-option",
                  checked && "ap-quiz-option--selected",
                )}
                onClick={() => selectOption(opt.id)}
              >
                <span className="ap-quiz-option-marker" aria-hidden>
                  {checked ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {!selectedId ? (
          <p className="ap-quiz-hint">{m.quiz.selectAnswer}</p>
        ) : null}

        <Button
          type="button"
          className="ap-quiz-next-btn"
          disabled={!selectedId}
          onClick={goNext}
        >
          {isLast ? m.quiz.finish : m.quiz.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    )
  }

  const afterHref = passed && continueHref ? continueHref : backHref

  return (
    <div className="ap-quiz-results">
      <div
        className={cn(
          "ap-quiz-score-card",
          passed ? "ap-quiz-score-card--pass" : "ap-quiz-score-card--fail",
        )}
      >
        <p className="ap-quiz-score-label">{m.quiz.resultsTitle}</p>
        <p className="ap-quiz-score-value">{score}%</p>
        <p className="ap-quiz-score-verdict">
          {passed ? m.quiz.passed : m.quiz.failed}
        </p>
        <p className="ap-quiz-score-detail">
          {formatApprentissageMessage(m.quiz.correctCount, {
            correct: questions.filter(
              (q) => answers[q.id] === q.correctOptionId,
            ).length,
            total,
          })}
        </p>
      </div>

      <div className="ap-quiz-review">
        <h3>{m.quiz.reviewTitle}</h3>
        <ol className="ap-quiz-review-list">
          {questions.map((q, index) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctOptionId
            const userLabel = q.options.find((o) => o.id === userAnswer)?.label
            const correctLabel = q.options.find(
              (o) => o.id === q.correctOptionId,
            )?.label

            return (
              <li
                key={q.id}
                className={cn(
                  "ap-quiz-review-item",
                  isCorrect
                    ? "ap-quiz-review-item--ok"
                    : "ap-quiz-review-item--ko",
                )}
              >
                <div className="ap-quiz-review-item-head">
                  <span className="ap-quiz-review-num">{index + 1}</span>
                  {isCorrect ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <X className="size-4 text-red-600" />
                  )}
                  <span className="ap-quiz-review-status">
                    {isCorrect ? m.quiz.correct : m.quiz.incorrect}
                  </span>
                </div>
                {q.image ? (
                  <div className="ap-sign-quiz-review-image">
                    <Image
                      src={q.image}
                      alt=""
                      width={80}
                      height={80}
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="ap-quiz-review-prompt">{q.prompt}</p>
                <p className="ap-quiz-review-answer">
                  <strong>{m.quiz.yourAnswer}</strong> {userLabel ?? "—"}
                </p>
                {!isCorrect ? (
                  <p className="ap-quiz-review-answer ap-quiz-review-answer--good">
                    <strong>{m.quiz.rightAnswer}</strong> {correctLabel}
                  </p>
                ) : null}
                <p className="ap-quiz-review-explanation">{q.explanation}</p>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="ap-quiz-results-actions">
        <Button type="button" variant="outline" onClick={startQuiz} className="gap-2">
          <RotateCcw className="size-4" />
          {m.quiz.retry}
        </Button>
        <Button asChild>
          <Link href={afterHref}>
            {passed ? m.quiz.continuePath : m.quiz.backToModule}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
