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

import { clearProgressStorage } from "@/lib/apprentissage/progress-store"
import {
  createAcceptAllConsent,
  createRejectOptionalConsent,
  readConsentFromDocument,
  writeConsentToDocument,
  type CookieConsent,
} from "@/lib/cookies/consent"

type CookieConsentContextValue = {
  consent: CookieConsent | null
  hasDecided: boolean
  analytics: boolean
  learning: boolean
  acceptAll: () => void
  rejectOptional: () => void
  reopenBanner: () => void
  bannerOpen: boolean
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null,
)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readConsentFromDocument()
    setConsent(stored)
    setBannerOpen(stored === null)
    setHydrated(true)
  }, [])

  const persist = useCallback((next: CookieConsent) => {
    writeConsentToDocument(next)
    setConsent(next)
    setBannerOpen(false)
  }, [])

  const acceptAll = useCallback(() => {
    persist(createAcceptAllConsent())
  }, [persist])

  const rejectOptional = useCallback(() => {
    clearProgressStorage()
    persist(createRejectOptionalConsent())
  }, [persist])

  const reopenBanner = useCallback(() => {
    setBannerOpen(true)
  }, [])

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasDecided: hydrated && consent !== null,
      analytics: consent?.analytics === true,
      learning: consent?.learning === true,
      acceptAll,
      rejectOptional,
      reopenBanner,
      bannerOpen: hydrated && bannerOpen,
    }),
    [
      consent,
      hydrated,
      bannerOpen,
      acceptAll,
      rejectOptional,
      reopenBanner,
    ],
  )

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext)
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider")
  }
  return ctx
}
