export {
  getAppUrl,
  getAppUrls,
  getBackdashUrl,
  getCandidatUrl,
  getPlatformAdminUrl,
} from "@/lib/app-urls"

const TRIAL_DAYS = 15

export function getTrialEndsAt(from: Date = new Date()): Date {
  const end = new Date(from)
  end.setDate(end.getDate() + TRIAL_DAYS)
  return end
}

export function slugifyAutoEcole(nom: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)

  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || "auto-ecole"}-${suffix}`
}
