"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type QuizImmersiveContextValue = {
  immersive: boolean
  setImmersive: (value: boolean) => void
}

const QuizImmersiveContext = createContext<QuizImmersiveContextValue | null>(
  null,
)

export function QuizImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false)
  const value = useMemo(
    () => ({ immersive, setImmersive }),
    [immersive],
  )

  return (
    <QuizImmersiveContext.Provider value={value}>
      {children}
    </QuizImmersiveContext.Provider>
  )
}

export function useQuizImmersive() {
  const ctx = useContext(QuizImmersiveContext)
  if (!ctx) {
    throw new Error(
      "useQuizImmersive must be used within QuizImmersiveProvider",
    )
  }
  return ctx
}
