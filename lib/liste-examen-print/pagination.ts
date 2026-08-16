import type { ListeExamenSectionPrint } from "@/lib/api/mappers-liste-examen"
import { permisCodeEnArabe } from "@/lib/api/categories-permis"
import { LISTE_EXAMEN_PRINT_CAPS, type ListeExamenPrintCaps } from "./constants"
import { vehicleLabelAr } from "./vehicle-label"

export type ListeExamenTableChunk = {
  sectionCode: string
  groupeLabel: string
  vehicleLabel: string | null
  rowStartIndex: number
  rows: ListeExamenSectionPrint["rows"]
}

export type ListeExamenPrintPagePlan = {
  pageIndex: number
  totalPages: number
  showOfficialHeader: boolean
  showExamDetails: boolean
  showContinuationBanner: boolean
  showFooter: boolean
  footerOnly: boolean
  chunks: ListeExamenTableChunk[]
}

type Cursor = { chunkIndex: number; rowOffset: number }

type SectionBlocks = {
  baBlock: ListeExamenSectionPrint[]
  restBlock: ListeExamenSectionPrint[]
  hasBaPair: boolean
}

function sectionRowCount(sections: ListeExamenSectionPrint[]): number {
  return sections.reduce((n, s) => n + s.rows.length, 0)
}

function rowsFromCursor(chunks: ListeExamenTableChunk[], cursor: Cursor): number {
  let n = 0
  for (let i = cursor.chunkIndex; i < chunks.length; i++) {
    const slice =
      i === cursor.chunkIndex ? chunks[i].rows.slice(cursor.rowOffset) : chunks[i].rows
    n += slice.length
  }
  return n
}

function splitBaAndRest(sections: ListeExamenSectionPrint[]): SectionBlocks {
  const hasB = sections.some((s) => s.code.toUpperCase() === "B")
  const hasA = sections.some((s) => s.code.toUpperCase() === "A")
  const hasBaPair = hasB && hasA

  if (!hasBaPair) {
    return { baBlock: [], restBlock: sections, hasBaPair: false }
  }

  const baBlock = sections.filter((s) => {
    const c = s.code.toUpperCase()
    return c === "B" || c === "A"
  })
  const restBlock = sections.filter((s) => {
    const c = s.code.toUpperCase()
    return c !== "B" && c !== "A"
  })
  return { baBlock, restBlock, hasBaPair: true }
}

export function sectionsToTableChunks(
  sections: ListeExamenSectionPrint[],
  maxRowsPerChunk: number,
  sectionIndexOffset = 0,
): ListeExamenTableChunk[] {
  const out: ListeExamenTableChunk[] = []
  sections.forEach((section, sectionIdx) => {
    const groupeLabel = permisCodeEnArabe(section.code)
    const vehicleLabel = vehicleLabelAr(sectionIndexOffset + sectionIdx)
    const rows = section.rows.length > 0 ? section.rows : [null]
    for (let start = 0; start < rows.length; start += maxRowsPerChunk) {
      out.push({
        sectionCode: section.code,
        groupeLabel,
        vehicleLabel: start === 0 ? vehicleLabel : null,
        rowStartIndex: start,
        rows: rows.slice(start, start + maxRowsPerChunk),
      })
    }
  })
  return out
}

function takeRows(
  chunks: ListeExamenTableChunk[],
  cursor: Cursor,
  maxRows: number,
): { taken: ListeExamenTableChunk[]; next: Cursor } {
  const taken: ListeExamenTableChunk[] = []
  let used = 0
  let chunkIndex = cursor.chunkIndex
  let rowOffset = cursor.rowOffset

  while (chunkIndex < chunks.length && used < maxRows) {
    const src = chunks[chunkIndex]
    const slice = src.rows.slice(rowOffset)
    const need = maxRows - used

    if (slice.length <= need) {
      taken.push({
        sectionCode: src.sectionCode,
        groupeLabel: src.groupeLabel,
        vehicleLabel: rowOffset === 0 ? src.vehicleLabel : null,
        rowStartIndex: src.rowStartIndex + rowOffset,
        rows: slice,
      })
      used += slice.length
      chunkIndex++
      rowOffset = 0
      continue
    }

    taken.push({
      sectionCode: src.sectionCode,
      groupeLabel: src.groupeLabel,
      vehicleLabel: rowOffset === 0 ? src.vehicleLabel : null,
      rowStartIndex: src.rowStartIndex + rowOffset,
      rows: slice.slice(0, need),
    })
    rowOffset += need
    used += need
    break
  }

  return { taken, next: { chunkIndex, rowOffset } }
}

function makePage(
  partial: Omit<ListeExamenPrintPagePlan, "pageIndex" | "totalPages" | "showContinuationBanner">,
  index: number,
  total: number,
): ListeExamenPrintPagePlan {
  return {
    ...partial,
    pageIndex: index,
    totalPages: total,
    showContinuationBanner: false,
  }
}

type DraftPage = Omit<
  ListeExamenPrintPagePlan,
  "pageIndex" | "totalPages" | "showContinuationBanner"
>

function pushTablePages(
  draft: DraftPage[],
  chunks: ListeExamenTableChunk[],
  caps: ListeExamenPrintCaps,
  options: { withHeader: boolean; withFooter: boolean },
): void {
  if (chunks.length === 0) return

  let cursor: Cursor = { chunkIndex: 0, rowOffset: 0 }
  let pageIdx = 0

  while (cursor.chunkIndex < chunks.length) {
    const remaining = rowsFromCursor(chunks, cursor)
    const isFirstOfBatch = pageIdx === 0
    const isLastBatch =
      remaining <= (options.withFooter ? caps.footerPageMaxTableRows : caps.middlePageTableRows)

    let cap: number
    if (isFirstOfBatch && options.withHeader) {
      cap = caps.firstPageTableRows
    } else if (isLastBatch && options.withFooter) {
      cap = remaining
    } else {
      cap = caps.middlePageTableRows
    }

    const { taken, next } = takeRows(chunks, cursor, cap)
    cursor = next
    const isLastPage = cursor.chunkIndex >= chunks.length

    draft.push({
      showOfficialHeader: isFirstOfBatch && options.withHeader,
      showExamDetails: isFirstOfBatch && options.withHeader,
      showFooter: isLastPage && options.withFooter,
      footerOnly: false,
      chunks: taken,
    })
    pageIdx++
  }
}

function buildCategoryAwarePages(
  sections: ListeExamenSectionPrint[],
  caps: ListeExamenPrintCaps,
): ListeExamenPrintPagePlan[] {
  const { baBlock, restBlock, hasBaPair } = splitBaAndRest(sections)
  const draft: DraftPage[] = []

  if (sections.length === 0) {
    return [
      makePage(
        {
          showOfficialHeader: true,
          showExamDetails: true,
          showFooter: true,
          footerOnly: false,
          chunks: [],
        },
        0,
        1,
      ),
    ]
  }

  if (!hasBaPair || restBlock.length === 0) {
    const allChunks = sectionsToTableChunks(sections, caps.maxRowsPerSectionChunk)
    draft.push({
      showOfficialHeader: true,
      showExamDetails: true,
      showFooter: true,
      footerOnly: false,
      chunks: allChunks,
    })
    return draft.map((p, i) => makePage(p, i, 1))
  }

  const baChunks = sectionsToTableChunks(baBlock, caps.maxRowsPerSectionChunk, 0)
  const restChunks = sectionsToTableChunks(
    restBlock,
    caps.maxRowsPerSectionChunk,
    baBlock.length,
  )

  draft.push({
    showOfficialHeader: true,
    showExamDetails: true,
    showFooter: false,
    footerOnly: false,
    chunks: baChunks,
  })

  pushTablePages(draft, restChunks, caps, { withHeader: false, withFooter: true })

  return draft.map((p, i) => makePage(p, i, draft.length))
}

export function buildListeExamenPrintPages(
  sections: ListeExamenSectionPrint[],
  caps: ListeExamenPrintCaps = LISTE_EXAMEN_PRINT_CAPS,
): ListeExamenPrintPagePlan[] {
  return buildCategoryAwarePages(sections, caps)
}
