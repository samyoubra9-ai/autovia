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
  markIntersectionUnstudied,
  markSignStudied,
  markSignUnstudied,
  readProgress,
  recordIntersectionsQuizScore,
  recordPanneauxQuizScore,
  resetProgress,
  unmarkCategoryCompleted,
  writeProgress,
} from "@/lib/apprentissage/progress-store"
import type { ApprentissageProgress } from "@/lib/apprentissage/tracks/types"
import {
  categoryHasSections,
  getPanneauCategory,
  getPanneauSection,
} from "@/lib/apprentissage/tracks/content"
import { sectionProgressKey, signKey } from "@/lib/apprentissage/tracks/types"

type ApprentissageProgressContextValue = {
  progress: ApprentissageProgress
  hydrated: boolean
  learningEnabled: boolean
  studySign: (
    categorySlug: string,
    signId: string,
    sectionSlug?: string,
  ) => void
  unstudySign: (
    categorySlug: string,
    signId: string,
    sectionSlug?: string,
  ) => void
  studyIntersection: (typeSlug: string) => void
  unstudyIntersection: (typeSlug: string) => void
  savePanneauxQuiz: (scorePercent: number, passPercent: number) => void
  saveIntersectionsQuiz: (scorePercent: number, passPercent: number) => void
  resetAll: () => void
}

const ApprentissageProgressContext =
  createContext<ApprentissageProgressContextValue | null>(null)

function syncPanneauxUnitCompletion(
  progress: ApprentissageProgress,
  categorySlug: string,
  sectionSlug?: string,
): ApprentissageProgress {
  const cat = getPanneauCategory(categorySlug)
  if (!cat) return progress

  if (sectionSlug) {
    const section = getPanneauSection(categorySlug, sectionSlug)
    if (!section || section.signs.length === 0) return progress

    const unitKey = sectionProgressKey(categorySlug, sectionSlug)
    const allStudied = section.signs.every((s) =>
      progress.panneaux.signsStudied.includes(
        signKey(categorySlug, s.id, sectionSlug),
      ),
    )

    return allStudied
      ? markCategoryCompleted(progress, unitKey)
      : unmarkCategoryCompleted(progress, unitKey)
  }

  if (categoryHasSections(cat)) return progress

  const signs = cat.signs ?? []
  if (signs.length === 0) return progress

  const allStudied = signs.every((s) =>
    progress.panneaux.signsStudied.includes(signKey(categorySlug, s.id)),
  )

  return allStudied
    ? markCategoryCompleted(progress, categorySlug)
    : unmarkCategoryCompleted(progress, categorySlug)
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
    setProgress(readProgress())
    setHydrated(true)
  }, [])

  const studySign = useCallback(
    (categorySlug: string, signId: string, sectionSlug?: string) => {
      setProgress((current) => {
        const withSign = markSignStudied(
          current,
          signKey(categorySlug, signId, sectionSlug),
        )
        const next = syncPanneauxUnitCompletion(
          withSign,
          categorySlug,
          sectionSlug,
        )
        writeProgress(next)
        return next
      })
    },
    [],
  )

  const unstudySign = useCallback(
    (categorySlug: string, signId: string, sectionSlug?: string) => {
      setProgress((current) => {
        const withoutSign = markSignUnstudied(
          current,
          signKey(categorySlug, signId, sectionSlug),
        )
        const next = syncPanneauxUnitCompletion(
          withoutSign,
          categorySlug,
          sectionSlug,
        )
        writeProgress(next)
        return next
      })
    },
    [],
  )

  const studyIntersection = useCallback((typeSlug: string) => {
    setProgress((current) => {
      const next = markIntersectionStudied(current, typeSlug)
      writeProgress(next)
      return next
    })
  }, [])

  const unstudyIntersection = useCallback((typeSlug: string) => {
    setProgress((current) => {
      const next = markIntersectionUnstudied(current, typeSlug)
      writeProgress(next)
      return next
    })
  }, [])

  const savePanneauxQuiz = useCallback(
    (scorePercent: number, passPercent: number) => {
      setProgress((current) => {
        const next = recordPanneauxQuizScore(current, scorePercent, passPercent)
        writeProgress(next)
        return next
      })
    },
    [],
  )

  const saveIntersectionsQuiz = useCallback(
    (scorePercent: number, passPercent: number) => {
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
      learningEnabled: learning,
      studySign,
      unstudySign,
      studyIntersection,
      unstudyIntersection,
      savePanneauxQuiz,
      saveIntersectionsQuiz,
      resetAll,
    }),
    [
      progress,
      hydrated,
      learning,
      studySign,
      unstudySign,
      studyIntersection,
      unstudyIntersection,
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
