import { permisCodeEnArabe } from "@/lib/api/categories-permis"
import type { ListeExamenSectionPrint } from "@/lib/api/mappers-liste-examen"

type SchoolCategoryRef = { code: string; ordre?: number }

/** Catégorie unique affichée après « مكلف: » (première catégorie de la liste, sinon 1re de l'école). */
export function listeExamenMoniteurCategorieLabel(
  sections: ListeExamenSectionPrint[],
  schoolCategories?: SchoolCategoryRef[] | null,
): string {
  const codes = sections
    .filter((s) => s.rows.some((r) => r != null))
    .map((s) => s.code.trim())
    .filter(Boolean)

  if (codes.length > 0) {
    const unique = [...new Set(codes)]
    if (unique.length === 1) return permisCodeEnArabe(unique[0])
    return permisCodeEnArabe(codes[0])
  }

  if (schoolCategories?.length) {
    const sorted = [...schoolCategories].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    return permisCodeEnArabe(sorted[0].code)
  }

  return "—"
}

/** Catégorie « مكلف » pour un moniteur : valeur enregistrée, sinon dérivée de la liste. */
export function listeExamenMoniteurSlotCategorieLabel(
  storedCategorie: string | null | undefined,
  sections: ListeExamenSectionPrint[],
  schoolCategories?: SchoolCategoryRef[] | null,
): string {
  const stored = storedCategorie?.trim()
  if (stored) {
    if (stored.includes("/")) {
      return stored
        .split("/")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" / ")
    }
    return stored
  }
  return listeExamenMoniteurCategorieLabel(sections, schoolCategories)
}
