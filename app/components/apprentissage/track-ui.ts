import { GitMerge, Signpost, type LucideIcon } from "lucide-react"

import type { TrackSlug } from "@/lib/apprentissage/tracks/types"

export const TRACK_UI: Record<
  TrackSlug,
  { icon: LucideIcon; accent: string; soft: string }
> = {
  panneaux: {
    icon: Signpost,
    accent: "#2563eb",
    soft: "#eff6ff",
  },
  intersections: {
    icon: GitMerge,
    accent: "#7c3aed",
    soft: "#f5f3ff",
  },
}

export const FAMILY_COLORS: Record<string, { accent: string; soft: string }> = {
  vertical: { accent: "#2563eb", soft: "#eff6ff" },
  horizontal: { accent: "#64748b", soft: "#f8fafc" },
  lumineuse: { accent: "#ea580c", soft: "#fff7ed" },
  "agent-ordre": { accent: "#0d9488", soft: "#f0fdfa" },
}

export const CATEGORY_COLORS: Record<string, { accent: string; soft: string }> = {
  danger: { accent: "#dc2626", soft: "#fef2f2" },
  interdiction: { accent: "#b91c1c", soft: "#fff1f2" },
  obligation: { accent: "#2563eb", soft: "#eff6ff" },
  indication: { accent: "#0891b2", soft: "#ecfeff" },
  priorite: { accent: "#ca8a04", soft: "#fefce8" },
  balisage: { accent: "#d97706", soft: "#fffbeb" },
  "lignes-longitudinales": { accent: "#475569", soft: "#f1f5f9" },
  "lignes-transversales": { accent: "#334155", soft: "#f8fafc" },
  "marquages-divers": { accent: "#0f766e", soft: "#f0fdfa" },
}
