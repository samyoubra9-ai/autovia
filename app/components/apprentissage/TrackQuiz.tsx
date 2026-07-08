"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import {
  computeQuizScore,
  getOptionLetter,
  prepareQuizSession,
} from "@/lib/apprentissage/quiz"
import type { TrackQuizQuestion } from "@/lib/apprentissage/quiz-types"
import { cn } from "@/lib/utils"

import { useQuizImmersive } from "./QuizImmersiveContext"

export type { TrackQuizQuestion } from "@/lib/apprentissage/quiz-types"

type QuizPhase = "intro" | "playing" | "results"
type QuizFlash = "ok" | "ko" | null

type TrackQuizProps = {
  questions: TrackQuizQuestion[]
  passPercent: number
  backHref: string
  continueHref?: string
  onComplete: (scorePercent: number) => void
  gameMode?: boolean
  timePerQuestionSec?: number
}

const FLASH_MS = 450

export function TrackQuiz({
  questions,
  passPercent,
  backHref,
  continueHref,
  onComplete,
  gameMode = false,
  timePerQuestionSec = 10,
}: TrackQuizProps) {
  const { locale } = useVitrineLocale()
  const m = getApprentissageMessages(locale)
  const { setImmersive } = useQuizImmersive()

  const [phase, setPhase] = useState<QuizPhase>("intro")
  const [sessionQuestions, setSessionQuestions] = useState<TrackQuizQuestion[]>(
    [],
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [scoreSaved, setScoreSaved] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timePerQuestionSec)
  const [questionLocked, setQuestionLocked] = useState(false)
  const [flash, setFlash] = useState<QuizFlash>(null)

  const answersRef = useRef(answers)
  const completedIdsRef = useRef(completedIds)
  const sessionQuestionsRef = useRef(sessionQuestions)
  const currentIndexRef = useRef(currentIndex)
  const questionLockedRef = useRef(questionLocked)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  answersRef.current = answers
  completedIdsRef.current = completedIds
  sessionQuestionsRef.current = sessionQuestions
  currentIndexRef.current = currentIndex
  questionLockedRef.current = questionLocked

  const current = sessionQuestions[currentIndex]
  const total = sessionQuestions.length
  const selectedId = current ? answers[current.id] : undefined
  const isLast = currentIndex === total - 1

  const reviewQuestions = useMemo(
    () =>
      completedIds
        .map((id) => sessionQuestions.find((q) => q.id === id))
        .filter((q): q is TrackQuizQuestion => q !== undefined),
    [completedIds, sessionQuestions],
  )

  const score = useMemo(
    () => computeQuizScore(reviewQuestions, answers),
    [reviewQuestions, answers],
  )
  const passed = score >= passPercent

  const liveCorrect = useMemo(
    () =>
      completedIds.filter((id) => {
        const q = sessionQuestions.find((item) => item.id === id)
        return q && answers[id] === q.correctOptionId
      }).length,
    [completedIds, sessionQuestions, answers],
  )

  useEffect(() => {
    if (!gameMode) return
    setImmersive(phase === "playing")
    return () => setImmersive(false)
  }, [gameMode, phase, setImmersive])

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    }
  }, [])

  const finishQuiz = useCallback(
    (
      finalAnswers: Record<string, string>,
      finalCompleted: string[],
      questionsSnapshot: TrackQuizQuestion[],
    ) => {
      const reviewed = finalCompleted
        .map((id) => questionsSnapshot.find((q) => q.id === id))
        .filter((q): q is TrackQuizQuestion => q !== undefined)

      const finalScore = computeQuizScore(reviewed, finalAnswers)
      if (!scoreSaved) {
        onComplete(finalScore)
        setScoreSaved(true)
      }
      setPhase("results")
      setQuestionLocked(false)
      setFlash(null)
    },
    [onComplete, scoreSaved],
  )

  const goToNextQuestion = useCallback(
    (
      nextAnswers: Record<string, string>,
      nextCompleted: string[],
      fromIndex: number,
      questionsSnapshot: TrackQuizQuestion[],
    ) => {
      const lastIndex = questionsSnapshot.length - 1

      if (fromIndex >= lastIndex) {
        finishQuiz(nextAnswers, nextCompleted, questionsSnapshot)
        return
      }

      setAnswers(nextAnswers)
      setCompletedIds(nextCompleted)
      setCurrentIndex(fromIndex + 1)
      setQuestionLocked(false)
      setFlash(null)
      setTimeLeft(timePerQuestionSec)
    },
    [finishQuiz, timePerQuestionSec],
  )

  const resolveQuestion = useCallback(
    (optionId: string | null, flashKind: QuizFlash) => {
      const q = sessionQuestionsRef.current[currentIndexRef.current]
      if (!q || questionLockedRef.current) return

      questionLockedRef.current = true
      setQuestionLocked(true)
      setFlash(flashKind)

      const nextAnswers = optionId
        ? { ...answersRef.current, [q.id]: optionId }
        : answersRef.current

      const nextCompleted = completedIdsRef.current.includes(q.id)
        ? completedIdsRef.current
        : [...completedIdsRef.current, q.id]

      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = setTimeout(() => {
        goToNextQuestion(
          nextAnswers,
          nextCompleted,
          currentIndexRef.current,
          sessionQuestionsRef.current,
        )
      }, FLASH_MS)
    },
    [goToNextQuestion],
  )

  const handleTimeout = useCallback(() => {
    resolveQuestion(null, "ko")
  }, [resolveQuestion])

  useEffect(() => {
    if (!gameMode || phase !== "playing" || !current || questionLocked) return

    setTimeLeft(timePerQuestionSec)

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          window.clearInterval(interval)
          if (!questionLockedRef.current) {
            handleTimeout()
          }
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => window.clearInterval(interval)
  }, [
    gameMode,
    phase,
    current?.id,
    currentIndex,
    questionLocked,
    timePerQuestionSec,
    handleTimeout,
  ])

  function startQuiz() {
    const session = prepareQuizSession(questions)
    setSessionQuestions(session)
    setCurrentIndex(0)
    setAnswers({})
    setCompletedIds([])
    setScoreSaved(false)
    setQuestionLocked(false)
    setFlash(null)
    setTimeLeft(timePerQuestionSec)

    if (session.length === 0) {
      setPhase("intro")
      return
    }

    setPhase("playing")
  }

  function selectOption(optionId: string) {
    if (!current) return
    if (gameMode) {
      if (questionLocked) return
      const isCorrect = optionId === current.correctOptionId
      resolveQuestion(optionId, isCorrect ? "ok" : "ko")
      return
    }
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }))
  }

  function goNext() {
    if (!current || !selectedId) return

    const nextCompleted = completedIds.includes(current.id)
      ? completedIds
      : [...completedIds, current.id]

    if (!completedIds.includes(current.id)) {
      setCompletedIds(nextCompleted)
    }

    if (isLast) {
      finishQuiz(answers, nextCompleted, sessionQuestions)
      return
    }

    setCurrentIndex((i) => i + 1)
  }

  const introCount = questions.length
  const timerPercent = Math.max(
    0,
    Math.min(100, (timeLeft / timePerQuestionSec) * 100),
  )
  const timerUrgent = gameMode && timeLeft <= 3

  if (introCount === 0 && phase === "intro") {
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
      <div
        className={cn(
          "ap-quiz-intro ap-quiz-enter",
          gameMode && "ap-quiz-intro--game",
        )}
      >
        <p className="ap-quiz-intro-text">
          {gameMode ? m.quiz.gameIntro : m.quiz.intro}
        </p>
        <ul className="ap-quiz-intro-list">
          <li>
            {formatApprentissageMessage(m.quiz.questionCount, {
              count: introCount,
            })}
          </li>
          {gameMode ? (
            <li>
              {formatApprentissageMessage(m.quiz.timePerQuestion, {
                seconds: timePerQuestionSec,
              })}
            </li>
          ) : null}
          <li>
            {formatApprentissageMessage(m.quiz.passRequirement, {
              score: passPercent,
            })}
          </li>
          <li>{m.quiz.correctionAtEnd}</li>
        </ul>
        <Button type="button" size="lg" onClick={startQuiz} className="gap-2">
          {gameMode ? m.quiz.gameStart : m.quiz.start}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    )
  }

  if (phase === "playing") {
    if (!current) {
      return (
        <div className="ap-quiz-empty">
          <p>{m.quiz.noQuestions}</p>
          <Button type="button" variant="outline" onClick={startQuiz}>
            {m.quiz.retry}
          </Button>
        </div>
      )
    }

    return (
      <div
        className={cn(
          "ap-quiz-play",
          gameMode && "ap-quiz-play--game ap-quiz-enter",
          flash === "ok" && "ap-quiz-play--flash-ok",
          flash === "ko" && "ap-quiz-play--flash-ko",
        )}
      >
        {gameMode ? (
          <div className="ap-quiz-game-top">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ap-quiz-game-quit"
            >
              <Link href={backHref}>{m.quiz.quitGame}</Link>
            </Button>
            <span className="ap-quiz-game-score">
              {formatApprentissageMessage(m.quiz.liveScore, {
                correct: liveCorrect,
                total: completedIds.length,
              })}
            </span>
            <span className="ap-quiz-game-step">
              {formatApprentissageMessage(m.quiz.questionOf, {
                current: currentIndex + 1,
                total,
              })}
            </span>
          </div>
        ) : null}

        <div
          key={gameMode ? current.id : "quiz-step"}
          className={cn(gameMode && "ap-quiz-game-body ap-quiz-enter")}
        >
        <div className="ap-quiz-play-head">
          {!gameMode ? (
            <span className="ap-quiz-play-step">
              {formatApprentissageMessage(m.quiz.questionOf, {
                current: currentIndex + 1,
                total,
              })}
            </span>
          ) : null}
          {gameMode ? (
            <div
              className={cn(
                "ap-quiz-game-timer",
                timerUrgent && "ap-quiz-game-timer--urgent",
              )}
              role="timer"
              aria-live="polite"
              aria-label={formatApprentissageMessage(m.quiz.timePerQuestion, {
                seconds: Math.ceil(timeLeft),
              })}
            >
              <div className="ap-quiz-game-timer-track">
                <div
                  className="ap-quiz-game-timer-fill"
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
              <span className="ap-quiz-game-timer-value">
                {Math.ceil(timeLeft)}s
              </span>
            </div>
          ) : (
            <div className="ap-quiz-play-progress">
              <div
                className="ap-progress-fill"
                style={{
                  width: `${((currentIndex + (selectedId ? 1 : 0)) / total) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {current.image ? (
          <div
            className={cn(
              "ap-sign-quiz-image-wrap",
              gameMode && "ap-sign-quiz-image-wrap--game",
            )}
          >
            <Image
              src={current.image}
              alt=""
              width={gameMode ? 280 : 160}
              height={gameMode ? 280 : 160}
              className="ap-sign-quiz-image"
              unoptimized
              priority={gameMode}
            />
          </div>
        ) : null}

        <h2 className="ap-quiz-prompt">{current.prompt}</h2>

        {gameMode && flash === "ko" && !selectedId ? (
          <p className="ap-quiz-game-timeup">{m.quiz.timeUp}</p>
        ) : null}

        <div className="ap-quiz-options" role="radiogroup" aria-label={current.prompt}>
          {current.options.map((opt, index) => {
            const checked = selectedId === opt.id
            const showCorrect =
              gameMode && questionLocked && opt.id === current.correctOptionId
            const showWrong =
              gameMode &&
              questionLocked &&
              checked &&
              opt.id !== current.correctOptionId

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={gameMode && questionLocked}
                className={cn(
                  "ap-quiz-option",
                  checked && "ap-quiz-option--selected",
                  showCorrect && "ap-quiz-option--correct",
                  showWrong && "ap-quiz-option--wrong",
                )}
                onClick={() => selectOption(opt.id)}
              >
                <span className="ap-quiz-option-letter" aria-hidden>
                  {getOptionLetter(index)}
                </span>
                <span className="ap-quiz-option-marker" aria-hidden>
                  {showCorrect || (checked && !gameMode) ? (
                    <Check className="size-3.5" />
                  ) : showWrong ? (
                    <X className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                </span>
                <span className="ap-quiz-option-label">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {!gameMode && !selectedId ? (
          <p className="ap-quiz-hint">{m.quiz.selectAnswer}</p>
        ) : null}

        {!gameMode ? (
          <div className="ap-quiz-play-actions">
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
        ) : null}

        {gameMode && flash ? (
          <div
            className={cn(
              "ap-quiz-game-flash",
              flash === "ok"
                ? "ap-quiz-game-flash--ok"
                : "ap-quiz-game-flash--ko",
            )}
            aria-hidden
          >
            {flash === "ok" ? (
              <Check className="size-10" strokeWidth={2.5} />
            ) : (
              <X className="size-10" strokeWidth={2.5} />
            )}
          </div>
        ) : null}
        </div>
      </div>
    )
  }

  if (phase !== "results") {
    return null
  }

  const afterHref = passed && continueHref ? continueHref : backHref
  const correctCount = reviewQuestions.filter(
    (q) => answers[q.id] === q.correctOptionId,
  ).length

  return (
    <div className="ap-quiz-results ap-quiz-enter">
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
            correct: correctCount,
            total: reviewQuestions.length,
          })}
        </p>
      </div>

      <div className="ap-quiz-review">
        <h3>{m.quiz.reviewTitle}</h3>
        {reviewQuestions.length === 0 ? (
          <p className="ap-quiz-review-empty">{m.quiz.noQuestions}</p>
        ) : (
          <ol className="ap-quiz-review-list">
            {reviewQuestions.map((q, index) => {
              const userAnswerId = answers[q.id]
              const isCorrect = userAnswerId === q.correctOptionId
              const explanation = q.explanation.trim()

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

                  <ul className="ap-quiz-review-options">
                    {q.options.map((opt, optIndex) => {
                      const isUser = opt.id === userAnswerId
                      const isRight = opt.id === q.correctOptionId
                      return (
                        <li
                          key={opt.id}
                          className={cn(
                            "ap-quiz-review-option",
                            isRight && "ap-quiz-review-option--correct",
                            isUser &&
                              !isRight &&
                              "ap-quiz-review-option--wrong",
                            isUser && isRight && "ap-quiz-review-option--picked-ok",
                          )}
                        >
                          <span className="ap-quiz-option-letter">
                            {getOptionLetter(optIndex)}
                          </span>
                          <span className="ap-quiz-review-option-label">
                            {opt.label}
                          </span>
                          {isUser ? (
                            <span className="ap-quiz-review-option-tag">
                              {m.quiz.yourChoice}
                            </span>
                          ) : null}
                          {isRight ? (
                            <span className="ap-quiz-review-option-tag ap-quiz-review-option-tag--ok">
                              {m.quiz.correct}
                            </span>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>

                  {explanation ? (
                    <p className="ap-quiz-review-explanation">{explanation}</p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="ap-quiz-results-actions">
        <Button
          type="button"
          variant="outline"
          onClick={startQuiz}
          className="ap-quiz-action-btn gap-2"
        >
          <RotateCcw className="size-4" />
          {m.quiz.retry}
        </Button>
        <Button asChild className="ap-quiz-action-btn">
          <Link href={afterHref}>
            {passed ? m.quiz.continuePath : m.quiz.backToModule}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
