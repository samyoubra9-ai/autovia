import { launchServerlessBrowser } from "@/lib/pdf/puppeteer-serverless"
import { renderListeExamenPrintHtml } from "./render-html"
import type { ListeExamenDto } from "@/lib/api/mappers-liste-examen"
import {
  LISTE_EXAMEN_PAGE_MARGIN_MM,
  LISTE_EXAMEN_PAGE_MARGIN_TOP_MM,
} from "./constants"
import {
  listeExamenPrintablePageHeightMm,
  LISTE_EXAMEN_PRINT_MIN_SCALE,
  LISTE_EXAMEN_PRINT_SCALE_EDGE,
} from "./compute-print-scale"

export async function generateListeExamenPdf(
  liste: ListeExamenDto,
  autoEcoleNom?: string,
): Promise<Buffer> {
  const html = renderListeExamenPrintHtml(liste, autoEcoleNom, { skipClientFit: true })
  let browser

  try {
    browser = await launchServerlessBrowser()
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load" })
    await page.evaluate(() => document.fonts?.ready)

    const scale = await page.evaluate(
      (pageBodyMm, minScale, edge) => {
        function mmToPx(mm: number) {
          const probe = document.createElement("div")
          probe.style.cssText = `position:fixed;left:-9999px;top:0;height:${mm}mm;width:1px;visibility:hidden`
          document.body.appendChild(probe)
          const h = probe.offsetHeight
          probe.remove()
          return h
        }
        const pageHeight = mmToPx(pageBodyMm)
        const pages = document.querySelectorAll(".page")
        if (!pages.length) return 1
        let scale = 1
        pages.forEach((shell) => {
          const el = shell as HTMLElement
          el.style.transform = ""
          el.style.transformOrigin = ""
          el.style.width = ""
          el.style.height = ""
          el.style.removeProperty("--liste-examen-print-scale")
          void el.offsetHeight
          const contentHeight = Math.max(el.scrollHeight, el.getBoundingClientRect().height)
          if (contentHeight <= pageHeight || contentHeight <= 0) return
          let next = (pageHeight / contentHeight) * edge
          next = Math.max(minScale, Math.round(next * 1000) / 1000)
          scale = Math.min(scale, next)
        })
        return scale
      },
      listeExamenPrintablePageHeightMm(),
      LISTE_EXAMEN_PRINT_MIN_SCALE,
      LISTE_EXAMEN_PRINT_SCALE_EDGE,
    )

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      scale: typeof scale === "number" && scale > 0 && scale <= 1 ? scale : 1,
      margin: {
        top: `${LISTE_EXAMEN_PAGE_MARGIN_TOP_MM}mm`,
        right: `${LISTE_EXAMEN_PAGE_MARGIN_MM}mm`,
        bottom: `${LISTE_EXAMEN_PAGE_MARGIN_MM}mm`,
        left: `${LISTE_EXAMEN_PAGE_MARGIN_MM}mm`,
      },
    })
    return Buffer.from(pdf)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error("[liste-examen-pdf]", detail, error)
    throw new Error(`Génération PDF liste examen impossible: ${detail}`)
  } finally {
    await browser?.close().catch(() => undefined)
  }
}
