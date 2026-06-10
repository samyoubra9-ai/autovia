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
  const [progress, setProgress] = useState<ApprentissageProgress>(() =>
    readProgress(),
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setProgress(readProgress())
    setHydrated(true)
  }, [])

  const completeChapter = useCallback(
    (moduleSlug: ModuleSlug, chapterSlug: ChapterSlug) => {
      setProgress((current) => {
        const next = markChapterComplete(current, moduleSlug, chapterSlug)
        writeProgress(next)
        return next
      })
    },
    [],
  )

  const saveQuizScore = useCallback(
    (moduleSlug: ModuleSlug, scorePercent: number) => {
      setProgress((current) => {
        const next = recordQuizScore(current, moduleSlug, scorePercent)
        writeProgress(next)
        return next
      })
    },
    [],
  )

  const resetAll = useCallback(() => {
    const empty = resetProgress()
    setProgress(empty)
  }, [])

  const value = useMemo(
    () => ({
      progress,
      hydrated,
      completeChapter,
      saveQuizScore,
      resetAll,
    }),
    [progress, hydrated, completeChapter, saveQuizScore, resetAll],
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
