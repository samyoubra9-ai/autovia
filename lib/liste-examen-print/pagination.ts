import type { ListeExamenSectionPrint } from "@/lib/api/mappers-liste-examen"
import { permisCodeEnArabe } from "@/lib/api/categories-permis"
import { LISTE_EXAMEN_PRINT_CAPS, type ListeExamenPrintCaps } from "./constants"
import { vehicleLabelAr } from "./vehicle-label"

export type ListeExamenTableChunk = {
  sectionCode: string
  groupeLabel: string
  vehicleLabel: string | null
  /** Index de la 1re ligne dans le bloc catégorie (الرقم repart de 1 par catégorie). */
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
  chunks: ListeExamenTableChunk[]
}

type Cursor = { chunkIndex: number; rowOffset: number }

function totalRows(chunks: ListeExamenTableChunk[]): number {
  return chunks.reduce((n, c) => n + c.rows.length, 0)
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

export function sectionsToTableChunks(
  sections: ListeExamenSectionPrint[],
  maxRowsPerChunk: number,
): ListeExamenTableChunk[] {
  const out: ListeExamenTableChunk[] = []
  sections.forEach((section, sectionIdx) => {
    const groupeLabel = permisCodeEnArabe(section.code)
    const vehicleLabel = vehicleLabelAr(sectionIdx)
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

function pageRowCount(page: ListeExamenPrintPagePlan): number {
  return page.chunks.reduce((n, c) => n + c.rows.length, 0)
}

function mergeChunks(
  a: ListeExamenTableChunk[],
  b: ListeExamenTableChunk[],
): ListeExamenTableChunk[] {
  return [...a, ...b]
}

function capacityForPage(
  remaining: number,
  pageCap: number,
  caps: ListeExamenPrintCaps,
  options?: { isFirstPage?: boolean },
): { capacity: number; showFooter: boolean } {
  const minTail = caps.minRowsBeforeFooterPage
  const footerMax = caps.footerPageMaxTableRows

  if (remaining <= footerMax) {
    return { capacity: remaining, showFooter: true }
  }

  if (remaining > pageCap + footerMax) {
    return { capacity: pageCap, showFooter: false }
  }

  const tailIfFullPage = remaining - pageCap

  if (tailIfFullPage >= minTail && tailIfFullPage <= footerMax) {
    return { capacity: pageCap, showFooter: false }
  }

  // 1re page : toujours remplir au maximum (évite en-tête seul + grande zone vide).
  if (options?.isFirstPage && remaining > pageCap) {
    return { capacity: pageCap, showFooter: false }
  }

  if (tailIfFullPage > 0 && tailIfFullPage < minTail) {
    for (let footerRows = footerMax; footerRows >= minTail; footerRows--) {
      const take = remaining - footerRows
      if (take >= minTail && take <= pageCap) {
        return { capacity: take, showFooter: false }
      }
    }
  }

  if (remaining <= pageCap) {
    return { capacity: remaining, showFooter: true }
  }

  return { capacity: pageCap, showFooter: false }
}

function padPageToTargetRows(
  page: ListeExamenPrintPagePlan,
  targetRows: number,
): ListeExamenPrintPagePlan {
  if (page.showFooter || targetRows <= 0) return page
  const current = pageRowCount(page)
  if (current >= targetRows) return page
  const pad = targetRows - current
  const chunks = [...page.chunks]
  const last = chunks[chunks.length - 1]
  if (!last) return page
  chunks[chunks.length - 1] = {
    ...last,
    rows: [...last.rows, ...Array<ListeExamenSectionPrint["rows"][number]>(pad).fill(null)],
  }
  return { ...page, chunks }
}

function rebalancePages(
  pages: ListeExamenPrintPagePlan[],
  caps: ListeExamenPrintCaps,
): ListeExamenPrintPagePlan[] {
  if (pages.length < 2) return pages

  const minTail = caps.minRowsBeforeFooterPage
  const footerMax = caps.footerPageMaxTableRows
  const midCap = caps.middlePageRows
  let out = [...pages]
  let changed = true

  while (changed) {
    changed = false

    for (let i = 0; i < out.length - 1; i++) {
      const left = out[i]
      const right = out[i + 1]
      const leftRows = pageRowCount(left)
      const rightRows = pageRowCount(right)
      const combined = leftRows + rightRows

      if (
        !left.showFooter &&
        !right.showFooter &&
        leftRows < minTail &&
        combined <= midCap
      ) {
        out.splice(i, 2, {
          ...left,
          chunks: mergeChunks(left.chunks, right.chunks),
        })
        changed = true
        break
      }

      if (
        !left.showFooter &&
        right.showFooter &&
        leftRows < minTail &&
        combined <= footerMax
      ) {
        out.splice(i, 2, {
          ...right,
          chunks: mergeChunks(left.chunks, right.chunks),
          showOfficialHeader: left.showOfficialHeader,
          showExamDetails: left.showExamDetails,
          showContinuationBanner: left.showContinuationBanner || right.showContinuationBanner,
        })
        changed = true
        break
      }
    }

    if (changed) continue

    if (out.length >= 2) {
      const pre = out[out.length - 2]
      const last = out[out.length - 1]
      const preRows = pageRowCount(pre)
      const lastRows = pageRowCount(last)
      const combined = preRows + lastRows

      if (preRows < minTail && last.showFooter && combined <= footerMax) {
        out[out.length - 2] = {
          ...last,
          chunks: mergeChunks(pre.chunks, last.chunks),
          showOfficialHeader: pre.showOfficialHeader,
          showExamDetails: pre.showExamDetails,
          showContinuationBanner: pre.showContinuationBanner || last.showContinuationBanner,
        }
        out.pop()
        changed = true
        continue
      }

      if (!last.showFooter && lastRows < minTail && combined <= footerMax) {
        out[out.length - 2] = {
          ...pre,
          chunks: mergeChunks(pre.chunks, last.chunks),
          showFooter: true,
        }
        out.pop()
        changed = true
      }
    }
  }

  return out
}

function buildShortListPages(allChunks: ListeExamenTableChunk[]): ListeExamenPrintPagePlan[] {
  return [
    {
      pageIndex: 0,
      totalPages: 1,
      showOfficialHeader: true,
      showExamDetails: true,
      showContinuationBanner: false,
      showFooter: true,
      chunks: allChunks,
    },
  ]
}

function buildLongListPages(
  allChunks: ListeExamenTableChunk[],
  caps: ListeExamenPrintCaps,
): ListeExamenPrintPagePlan[] {
  const pages: ListeExamenPrintPagePlan[] = []
  let cursor: Cursor = { chunkIndex: 0, rowOffset: 0 }

  while (cursor.chunkIndex < allChunks.length) {
    const remaining = rowsFromCursor(allChunks, cursor)
    const isFirst = pages.length === 0
    const pageCap = isFirst ? caps.firstPageRows : caps.middlePageRows
    const { capacity, showFooter } = capacityForPage(remaining, pageCap, caps, {
      isFirstPage: isFirst,
    })

    const { taken, next } = takeRows(allChunks, cursor, capacity)
    pages.push({
      pageIndex: pages.length,
      totalPages: 0,
      showOfficialHeader: isFirst,
      showExamDetails: isFirst,
      showContinuationBanner: !isFirst,
      showFooter,
      chunks: taken,
    })
    cursor = next
  }

  const last = pages[pages.length - 1]
  if (last && !last.showFooter) {
    pages[pages.length - 1] = { ...last, showFooter: true }
  }

  const balanced = rebalancePages(pages, caps)
  const padded = balanced.map((page) => {
    if (page.showFooter) return page
    const cap = page.showOfficialHeader ? caps.firstPageRows : caps.middlePageRows
    return padPageToTargetRows(page, cap)
  })
  const totalPages = padded.length
  return padded.map((p, i) => ({ ...p, pageIndex: i, totalPages }))
}

export function buildListeExamenPrintPages(
  sections: ListeExamenSectionPrint[],
  caps: ListeExamenPrintCaps = LISTE_EXAMEN_PRINT_CAPS,
): ListeExamenPrintPagePlan[] {
  const allChunks = sectionsToTableChunks(sections, caps.maxRowsPerSectionChunk)
  if (allChunks.length === 0) return buildShortListPages([])

  const rowCount = totalRows(allChunks)
  if (rowCount <= caps.shortListMaxRows) return buildShortListPages(allChunks)

  return buildLongListPages(allChunks, caps)
}

