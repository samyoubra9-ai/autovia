import initiationData from "@/content/apprentissage/initiation.json"

import type { VitrineLocale } from "@/lib/i18n/vitrine-locale"

export type InitiationLabels = {
  fr: string
  ar: string
  kab: string
}

export type InitiationNodeVariant = "root" | "reglement" | "signalisation"

export type InitiationTreeNode = {
  slug: string
  variant: InitiationNodeVariant
  title: InitiationLabels
  image?: string
  href?: string
  children?: InitiationTreeNode[]
}

export type InitiationContent = {
  slug: string
  title: InitiationLabels
  description: InitiationLabels
  root: InitiationTreeNode
}

export const INITIATION = initiationData as InitiationContent

export function getInitiationLabel(
  labels: InitiationLabels,
  locale: VitrineLocale,
): string {
  const localized =
    locale === "kab" ? labels.kab : locale === "ar" ? labels.ar : labels.fr
  if (localized.trim()) return localized
  return labels.fr
}

/** Sous-titre bilingue : français pour ar/kab, arabe pour fr. */
export function getInitiationSubtitle(
  labels: InitiationLabels,
  locale: VitrineLocale,
): string | null {
  if (locale === "fr") return labels.ar !== labels.fr ? labels.ar : null
  return labels.fr
}

export function getInitiationPageTitle(locale: VitrineLocale): string {
  return getInitiationLabel(INITIATION.title, locale)
}

export function getInitiationPageDescription(locale: VitrineLocale): string {
  return getInitiationLabel(INITIATION.description, locale)
}
