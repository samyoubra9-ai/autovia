import type { IntersectionScenarioVehicle } from "./types"

export const INTERSECTION_VEHICLE_COLORS = {
  red: { hex: "#dc2626", ring: "#fecaca", labelFr: "Véhicule rouge" },
  blue: { hex: "#2563eb", ring: "#bfdbfe", labelFr: "Véhicule bleu" },
  green: { hex: "#16a34a", ring: "#bbf7d0", labelFr: "Véhicule vert" },
  yellow: { hex: "#ca8a04", ring: "#fef08a", labelFr: "Véhicule jaune" },
  orange: { hex: "#ea580c", ring: "#fed7aa", labelFr: "Véhicule orange" },
  purple: { hex: "#9333ea", ring: "#e9d5ff", labelFr: "Véhicule violet" },
  black: { hex: "#171717", ring: "#d4d4d4", labelFr: "Véhicule noir" },
  white: { hex: "#f8fafc", ring: "#cbd5e1", labelFr: "Véhicule blanc" },
} as const

export type IntersectionVehicleColor = keyof typeof INTERSECTION_VEHICLE_COLORS

export function getIntersectionVehicleLabel(
  color: IntersectionVehicleColor,
  customLabel?: string,
): string {
  const trimmed = customLabel?.trim()
  if (trimmed) return trimmed
  return INTERSECTION_VEHICLE_COLORS[color].labelFr
}

/** Normalise passingOrder (format plat ou par étapes) en groupes de véhicules. */
export function normalizePassingOrder(
  order:
    | (IntersectionScenarioVehicle | IntersectionScenarioVehicle[])[]
    | undefined,
): IntersectionScenarioVehicle[][] {
  if (!order?.length) return []

  const first = order[0]
  if (Array.isArray(first)) {
    return order as IntersectionScenarioVehicle[][]
  }

  return (order as IntersectionScenarioVehicle[]).map((vehicle) => [vehicle])
}

export function getPassingStepBadge(
  stepIndex: number,
  vehicleCount: number,
  m: {
    tracks: {
      scenarioPassesFirst: string
      scenarioPassTogetherFirst: string
      scenarioPassesNext: string
      scenarioPassTogetherNext: string
    }
  },
): string {
  const together = vehicleCount > 1
  const first = stepIndex === 0

  if (first && together) return m.tracks.scenarioPassTogetherFirst
  if (first) return m.tracks.scenarioPassesFirst
  if (together) return m.tracks.scenarioPassTogetherNext
  return m.tracks.scenarioPassesNext
}
