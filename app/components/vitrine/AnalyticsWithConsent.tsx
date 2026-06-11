"use client"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { useCookieConsent } from "./CookieConsentProvider"

export function AnalyticsWithConsent() {
  const { analytics } = useCookieConsent()

  if (!analytics) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
