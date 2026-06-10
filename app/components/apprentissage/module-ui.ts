import {
  Gauge,
  Route,
  Shield,
  Signpost,
  type LucideIcon,
} from "lucide-react"

import type { ModuleSlug } from "@/lib/apprentissage/types"

export const MODULE_UI: Record<
  ModuleSlug,
  { icon: LucideIcon; accent: string; soft: string }
> = {
  fondamentaux: {
    icon: Signpost,
    accent: "#2563eb",
    soft: "#eff6ff",
  },
  circulation: {
    icon: Route,
    accent: "#7c3aed",
    soft: "#f5f3ff",
  },
  conducteur: {
    icon: Gauge,
    accent: "#0891b2",
    soft: "#ecfeff",
  },
  situations: {
    icon: Shield,
    accent: "#059669",
    soft: "#ecfdf5",
  },
}
