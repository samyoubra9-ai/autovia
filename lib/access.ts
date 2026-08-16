import type { AutoEcole, SubscriptionStatus, VerificationStatus } from "@prisma/client"

import { isVerificationApproved } from "@/lib/verification/constants"

type AccessInput = Pick<
  AutoEcole,
  "subscriptionStatus" | "trialEndsAt" | "paidUntil" | "verificationStatus"
>

export function hasAutoEcoleAccess(autoEcole: AccessInput, now: Date = new Date()): boolean {
  if (!isVerificationApproved(autoEcole.verificationStatus)) {
    return false
  }

  switch (autoEcole.subscriptionStatus) {
    case "ACTIVE":
      if (autoEcole.paidUntil && autoEcole.paidUntil < now) return false
      return true
    case "TRIAL":
      return autoEcole.trialEndsAt > now
    case "EXPIRED":
    case "CANCELLED":
    default:
      return false
  }
}

export function getAccessLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    ACTIVE: "Actif (payé)",
    TRIAL: "Essai",
    EXPIRED: "Bloqué",
    CANCELLED: "Annulé",
  }
  return labels[status]
}

export function getAccessDetail(autoEcole: AccessInput, now: Date = new Date()): string {
  if (!isVerificationApproved(autoEcole.verificationStatus)) {
    return verificationAccessDetail(autoEcole.verificationStatus)
  }

  if (hasAutoEcoleAccess(autoEcole, now)) {
    if (autoEcole.subscriptionStatus === "ACTIVE" && autoEcole.paidUntil) {
      return `Accès jusqu'au ${autoEcole.paidUntil.toLocaleDateString("fr-FR")}`
    }
    if (autoEcole.subscriptionStatus === "TRIAL") {
      return `Essai jusqu'au ${autoEcole.trialEndsAt.toLocaleDateString("fr-FR")}`
    }
    return "Accès autorisé"
  }
  if (autoEcole.subscriptionStatus === "TRIAL") {
    return "Essai terminé"
  }
  if (autoEcole.subscriptionStatus === "EXPIRED" || autoEcole.subscriptionStatus === "CANCELLED") {
    if (autoEcole.trialEndsAt > now) {
      return `Bloqué — essai reprenable jusqu'au ${autoEcole.trialEndsAt.toLocaleDateString("fr-FR")}`
    }
    if (autoEcole.paidUntil && autoEcole.paidUntil > now) {
      return `Bloqué — abonnement reprenable jusqu'au ${autoEcole.paidUntil.toLocaleDateString("fr-FR")}`
    }
  }
  if (autoEcole.subscriptionStatus === "ACTIVE" && autoEcole.paidUntil) {
    return "Abonnement expiré"
  }
  return "Accès bloqué"
}

function verificationAccessDetail(status: VerificationStatus): string {
  switch (status) {
    case "PENDING_DOCUMENTS":
      return "En attente de vos documents (agrément + carte d'identité)"
    case "PENDING_REVIEW":
      return "Documents reçus — validation Autovia en cours"
    case "REJECTED":
      return "Dossier refusé — renvoyez vos documents"
    default:
      return "Vérification requise"
  }
}
