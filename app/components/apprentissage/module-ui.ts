import {
  BookOpen,
  Car,
  HeartPulse,
  Leaf,
  Signpost,
  type LucideIcon,
} from "lucide-react"

import type { ModuleSlug } from "@/lib/apprentissage/types"

export const MODULE_UI: Record<
  ModuleSlug,
  { icon: LucideIcon; accent: string; soft: string }
> = {
  "chapitre-1": {
    icon: Signpost,
    accent: "#2563eb",
    soft: "#eff6ff",
  },
  "chapitre-2": {
    icon: Car,
    accent: "#7c3aed",
    soft: "#f5f3ff",
  },
  "chapitre-3": {
    icon: BookOpen,
    accent: "#0891b2",
    soft: "#ecfeff",
  },
  "chapitre-4": {
    icon: HeartPulse,
    accent: "#dc2626",
    soft: "#fef2f2",
  },
  "chapitre-5": {
    icon: Leaf,
    accent: "#059669",
    soft: "#ecfdf5",
  },
}
