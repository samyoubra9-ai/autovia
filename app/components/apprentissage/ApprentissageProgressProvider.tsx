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
  markCategoryCompleted,
  markIntersectionStudied,
  markSignStudied,
  readProgress,
  recordIntersectionsQuizScore,
  recordPanneauxQuizScore,
  resetProgress,
  writeProgress,
} from "@/lib/apprentissage/progress-store"
import type { ApprentissageProgress } from "@/lib/apprentissage/tracks/types"
import { getPanneauCategory } from "@/lib/apprentissage/tracks/content"
import { signKey } from "@/lib/apprentissage/tracks/types"

type ApprentissageProgressContextValue = {
  progress: ApprentissageProgress
  hydrated: boolean
  learningEnabled: boolean
  studySign: (categorySlug: string, signId: string) => void
  studyIntersection: (typeSlug: string) => void
  savePanneauxQuiz: (scorePercent: number, passPercent: number) => void
  saveIntersectionsQuiz: (scorePercent: number, passPercent: number) => void
  resetAll: () => void
}

const ApprentissageProgressContext =
  createContext<ApprentissageProgressContextValue | null>(null)

function maybeCompleteCategory(
  progress: ApprentissageProgress,
  categorySlug: string,
): ApprentissageProgress {
  const cat = getPanneauCategory(categorySlug)
  if (!cat) return progress
  const allStudied = cat.signs.every((s) =>
    progress.panneaux.signsStudied.includes(signKey(categorySlug, s.id)),
  )
  if (!allStudied) return progress
  return markCategoryCompleted(progress, categorySlug)
}

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

  const studySign = useCallback(
    (categorySlug: string, signId: string) => {
      if (!learning) return
      setProgress((current) => {
        const withSign = markSignStudied(current, signKey(categorySlug, signId))
        const next = maybeCompleteCategory(withSign, categorySlug)
        writeProgress(next)
        return next
      })
    },
    [learning],
  )

  const studyIntersection = useCallback(
    (typeSlug: string) => {
      if (!learning) return
      setProgress((current) => {
        const next = markIntersectionStudied(current, typeSlug)
        writeProgress(next)
        return next
      })
    },
    [learning],
  )

  const savePanneauxQuiz = useCallback(
    (scorePercent: number, passPercent: number) => {
      if (!learning) return
      setProgress((current) => {
        const next = recordPanneauxQuizScore(current, scorePercent, passPercent)
        writeProgress(next)
        return next
      })
    },
    [learning],
  )

  const saveIntersectionsQuiz = useCallback(
    (scorePercent: number, passPercent: number) => {
      if (!learning) return
      setProgress((current) => {
        const next = recordIntersectionsQuizScore(
          current,
          scorePercent,
          passPercent,
        )
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
      studySign,
      studyIntersection,
      savePanneauxQuiz,
      saveIntersectionsQuiz,
      resetAll,
    }),
    [
      progress,
      hydrated,
      learning,
      studySign,
      studyIntersection,
      savePanneauxQuiz,
      saveIntersectionsQuiz,
      resetAll,
    ],
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
