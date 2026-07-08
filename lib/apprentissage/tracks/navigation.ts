import {
  categoryHasSections,
  familyHasFlatSigns,
  getPanneauFamily,
  PANNEAUX,
} from "./content"
import type { PanneauCategory } from "./types"
import {
  getPanneauCategoryHref,
  getPanneauFamilyHref,
  getPanneauSectionHref,
  getPanneauxHref,
} from "./routes"

export type PanneauStepDestination = {
  href: string
  label: string
}

function getCategoryEntry(
  familySlug: string,
  category: PanneauCategory,
): PanneauStepDestination {
  if (categoryHasSections(category)) {
    const first = category.sections![0]!
    return {
      href: getPanneauSectionHref(familySlug, category.slug, first.slug),
      label: first.title,
    }
  }

  return {
    href: getPanneauCategoryHref(familySlug, category.slug),
    label: category.title,
  }
}

/** Prochaine étape du parcours panneaux (section → section → catégorie → famille). */
export function getNextPanneauStep(
  familySlug: string,
  categorySlug: string,
  sectionSlug?: string,
): PanneauStepDestination | null {
  const family = getPanneauFamily(familySlug)
  if (!family) return null

  if (familyHasFlatSigns(family)) {
    const familyIndex = PANNEAUX.families.findIndex((f) => f.slug === familySlug)
    const nextFamily = PANNEAUX.families[familyIndex + 1]
    if (nextFamily) {
      if (familyHasFlatSigns(nextFamily)) {
        return {
          href: getPanneauFamilyHref(nextFamily.slug),
          label: nextFamily.title,
        }
      }
      const firstCategory = nextFamily.categories?.[0]
      if (firstCategory) {
        return getCategoryEntry(nextFamily.slug, firstCategory)
      }
    }
    return {
      href: getPanneauxHref(),
      label: PANNEAUX.title,
    }
  }

  const categoryIndex = family.categories!.findIndex((c) => c.slug === categorySlug)
  const category = family.categories![categoryIndex]
  if (!category) return null

  if (categoryHasSections(category)) {
    if (!sectionSlug) {
      return getCategoryEntry(familySlug, category)
    }

    const sectionIndex = category.sections!.findIndex((s) => s.slug === sectionSlug)
    const nextSection = category.sections![sectionIndex + 1]
    if (nextSection) {
      return {
        href: getPanneauSectionHref(
          familySlug,
          categorySlug,
          nextSection.slug,
        ),
        label: nextSection.title,
      }
    }
  }

  const nextCategory = family.categories![categoryIndex + 1]
  if (nextCategory) {
    const entry = getCategoryEntry(familySlug, nextCategory)
    return {
      href: entry.href,
      label: nextCategory.title,
    }
  }

  const familyIndex = PANNEAUX.families.findIndex((f) => f.slug === familySlug)
  const nextFamily = PANNEAUX.families[familyIndex + 1]
  if (nextFamily) {
    if (familyHasFlatSigns(nextFamily)) {
      return {
        href: getPanneauFamilyHref(nextFamily.slug),
        label: nextFamily.title,
      }
    }

    const firstCategory = nextFamily.categories?.[0]
    if (!firstCategory) {
      return {
        href: getPanneauFamilyHref(nextFamily.slug),
        label: nextFamily.title,
      }
    }

    const entry = getCategoryEntry(nextFamily.slug, firstCategory)
    return {
      href: entry.href,
      label: nextFamily.title,
    }
  }

  return {
    href: getPanneauxHref(),
    label: PANNEAUX.title,
  }
}
