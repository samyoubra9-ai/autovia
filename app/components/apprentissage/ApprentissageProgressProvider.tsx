"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useCookieConsent } from "@/app/components/vitrine/CookieConsentProvider"
import { createEmptyProgress } from "@/lib/apprentissage/access"
import {
  markChapterComplete,
  readProgress,
  recordQuizScore,
  resetProgress,
  writeProgress,
} from "@/lib/apprentissage/progress-store"
import type {
  ApprentissageProgress,
  ChapterSlug,
  ModuleSlug,
} from "@/lib/apprentissage/types"

type ApprentissageProgressContextValue = {
  progress: ApprentissageProgress
  hydrated: boolean
  learningEnabled: boolean
  completeChapter: (moduleSlug: ModuleSlug, chapterSlug: ChapterSlug) => void
  saveQuizScore: (moduleSlug: ModuleSlug, scorePercent: number) => void
  resetAll: () => void
}

const ApprentissageProgressContext =
  createContext<ApprentissageProgressContextValue | null>(null)

export function ApprentissageProgressProvider({
  children,
}: {
  children: ReactNode
}) {
  const { learning } = useCookieConsent()
  const [progress, setProgress] = useState<ApprentissageProgress>(() =>
    createEmptyProgress(),
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProgress(learning ? readProgress() : createEmptyProgress())
    setHydrated(true)
  }, [learning])

  const completeChapter = useCallback(
    (moduleSlug: ModuleSlug, chapterSlug: ChapterSlug) => {
      if (!learning) return
      setProgress((current) => {
        const next = markChapterComplete(current, moduleSlug, chapterSlug)
        writeProgress(next)
        return next
      })
    },
    [learning],
  )

  const saveQuizScore = useCallback(
    (moduleSlug: ModuleSlug, scorePercent: number) => {
      if (!learning) return
      setProgress((current) => {
        const next = recordQuizScore(current, moduleSlug, scorePercent)
        writeProgress(next)
        return next
      })
    },
    [learning],
  )

  const resetAll = useCallback(() => {
    if (!learning) {
      setProgress(createEmptyProgress())
      return
    }
    const empty = resetProgress()
    setProgress(empty)
  }, [learning])

  const value = useMemo(
    () => ({
      progress,
      hydrated,
      learningEnabled: learning,
      completeChapter,
      saveQuizScore,
      resetAll,
    }),
    [progress, hydrated, learning, completeChapter, saveQuizScore, resetAll],
  )

  return (
    <ApprentissageProgressContext.Provider value={value}>
      {children}
    </ApprentissageProgressContext.Provider>
  )
}

export function useApprentissageProgress() {
  const ctx = useContext(ApprentissageProgressContext)
  if (!ctx) {
    throw new Error(
      "useApprentissageProgress must be used within ApprentissageProgressProvider",
    )
  }
  return ctx
}
