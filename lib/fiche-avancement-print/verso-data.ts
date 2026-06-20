/** Lignes du journal (verso formation pratique — modèle officiel). */
export type VersoLogRow = {
  theme: string
  chapter: string | null
  chapterRowSpan?: number
  largeChapter?: boolean
}

export const VERSO_LOG_ROWS: VersoLogRow[] = [
  { theme: "1-1", chapter: "1", chapterRowSpan: 19, largeChapter: true },
  { theme: "1-2", chapter: null },
  { theme: "1-3", chapter: null },
  { theme: "1-4", chapter: null },
  { theme: "1-5+1-6", chapter: null },
  { theme: "1-7+1-8", chapter: null },
  { theme: "1-9+2-1", chapter: null },
  { theme: "2-2+2-3+2-4", chapter: null },
  { theme: "3-1+3-2", chapter: null },
  { theme: "4-1+4-2", chapter: null },
  { theme: "4-3", chapter: null },
  { theme: "4-4", chapter: null },
  { theme: "4-5", chapter: null },
  { theme: "4-5", chapter: null },
  { theme: "4-5", chapter: null },
  { theme: "4-6", chapter: null },
  { theme: "4-7+4-8", chapter: null },
  { theme: "4-9+4-10", chapter: null },
  { theme: "5-1+5-2", chapter: null },
  { theme: "1-1+1-2", chapter: "2", chapterRowSpan: 7, largeChapter: true },
  { theme: "1-2+2-1", chapter: null },
  { theme: "2-1+2-2", chapter: null },
  { theme: "3-1+3-2", chapter: null },
  { theme: "3-2+4-1+4-2", chapter: null },
  { theme: "4-3+4-4", chapter: null },
  { theme: "5-1+5-2+6-1+6-2", chapter: null },
  { theme: "1+2", chapter: "3" },
  { theme: "2+1", chapter: "3+4" },
  { theme: "2+3", chapter: "3+4" },
  { theme: "1+2", chapter: "5" },
]

export const VERSO_VEHICULE_CH1_ROW_COUNT = 6

export const VERSO_VEHICULE_CH1_THEMES = [
  "1-1+1-2",
  "1-3+1-4",
  "2-1",
  "2-2",
  "2-3",
  "2-4",
] as const

export const VERSO_VEHICULE_CH2_THEMES = [
  "1-1",
  "1-2",
  "1-3",
  "1-4",
  "1-4",
  "1-5",
  "1-5",
  "1-6",
  "2-1",
  "2-1",
  "2-1",
  "2-1",
  "2-1",
  "2-2",
  "2-2",
  "2-2",
  "2-2",
  "2-2",
  "3",
  "3",
  "3",
  "4",
  "4",
  "4",
] as const

function buildVersoLogRowsVehicule(): VersoLogRow[] {
  const themes = [...VERSO_VEHICULE_CH1_THEMES, ...VERSO_VEHICULE_CH2_THEMES]
  const ch2RowCount = VERSO_VEHICULE_CH2_THEMES.length
  return themes.map((theme, i) => {
    if (i === 0) {
      return {
        theme,
        chapter: "1",
        chapterRowSpan: VERSO_VEHICULE_CH1_ROW_COUNT,
        largeChapter: true,
      }
    }
    if (i < VERSO_VEHICULE_CH1_ROW_COUNT) {
      return { theme, chapter: null }
    }
    if (i === VERSO_VEHICULE_CH1_ROW_COUNT) {
      return {
        theme,
        chapter: "2",
        chapterRowSpan: ch2RowCount,
        largeChapter: true,
      }
    }
    return { theme, chapter: null }
  })
}

export const VERSO_LOG_ROWS_VEHICULE = buildVersoLogRowsVehicule()

export const VERSO_CONTROLE_CHAPTERS_VEHICULE = ["1", "2"] as const
export const VERSO_CONTROLE_CHAPTERS_FORMATION = ["1", "2", "3", "4", "5"] as const

export const VERSO_JOURNAL_ROW_COUNT = 30
export const VERSO_MAX_CONTROLE_ROWS = VERSO_CONTROLE_CHAPTERS_FORMATION.length
export const VERSO_SUMMARY_COL_COUNT = VERSO_MAX_CONTROLE_ROWS

export const VERSO_VOLUME_HOURS_VEHICULE = [
  { ch: "1", ar: "06ساعة" },
  { ch: "2", ar: "24ساعة" },
] as const

export const VERSO_VOLUME_HOURS_FORMATION = [
  { ch: "1", ar: "19 ساعة" },
  { ch: "2", ar: "07 ساعة" },
  { ch: "3", ar: "1سا 30د" },
  { ch: "4", ar: "1سا 30د" },
  { ch: "5", ar: "24 ساعة" },
] as const

export const VERSO_TOTAL_AR_FORMATION = "30 ساعة"
