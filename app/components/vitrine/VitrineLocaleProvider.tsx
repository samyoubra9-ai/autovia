"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

import {
  VITRINE_LOCALE_COOKIE,
  type VitrineLocale,
} from "@/lib/i18n/vitrine-locale"
import {
  getVitrineMessages,
  type VitrineMessages,
} from "@/lib/i18n/vitrine-messages"

type VitrineLocaleContextValue = {
  locale: VitrineLocale
  messages: VitrineMessages
  setLocale: (locale: VitrineLocale) => void
}

const VitrineLocaleContext = createContext<VitrineLocaleContextValue | null>(
  null,
)

export function VitrineLocaleProvider({
  locale,
  children,
}: {
  locale: VitrineLocale
  children: ReactNode
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const messages = useMemo(() => getVitrineMessages(locale), [locale])

  const setLocale = useCallback(
    (next: VitrineLocale) => {
      if (next === locale) return
      document.cookie = `${VITRINE_LOCALE_COOKIE}=${next};path=/;max-age=31536000;SameSite=Lax`
      startTransition(() => {
        router.refresh()
      })
    },
    [locale, router],
  )

  const value = useMemo(
    () => ({ locale, messages, setLocale }),
    [locale, messages, setLocale],
  )

  return (
    <VitrineLocaleContext.Provider value={value}>
      {children}
    </VitrineLocaleContext.Provider>
  )
}

export function useVitrineMessages(): VitrineMessages {
  const ctx = useContext(VitrineLocaleContext)
  if (!ctx) {
    return getVitrineMessages("fr")
  }
  return ctx.messages
}

export function useVitrineLocale() {
  const ctx = useContext(VitrineLocaleContext)
  if (!ctx) {
    throw new Error("useVitrineLocale must be used within VitrineLocaleProvider")
  }
  return ctx
}
