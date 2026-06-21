import { launchServerlessBrowser } from "@/lib/pdf/puppeteer-serverless"
import { ficheAvancementPrintApplyFitScript } from "./apply-fit-script"
import { renderFicheAvancementPrintHtml } from "./render-html"
import type { FicheAvancementData } from "./types"

export async function generateFicheAvancementPdf(
  data: FicheAvancementData,
): Promise<Buffer> {
  const html = renderFicheAvancementPrintHtml(data, { forPdf: true })
  let browser

  try {
    browser = await launchServerlessBrowser()
    const page = await browser.newPage()
    // A4 paysage @ 96 dpi — aligne mmToPx du script de fit avec l’impression
    await page.setViewport({
      width: Math.round((297 / 25.4) * 96),
      height: Math.round((210 / 25.4) * 96),
    })
    await page.setContent(html, { waitUntil: "load", timeout: 55_000 })
    await page.emulateMediaType("print")
    await page.evaluate(() => document.fonts?.ready)
    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          })
        }),
      )
    })
    await page.addScriptTag({ content: ficheAvancementPrintApplyFitScript() })
    await page.waitForFunction(
      () => Boolean(document.querySelector("[data-print-fiche-dual]")?.dataset.printScale),
      { timeout: 10_000 },
    )

    const pdf = await page.pdf({
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    return Buffer.from(pdf)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error("[fiche-avancement-pdf]", detail, error)
    throw new Error(`Génération PDF fiche d'avancement impossible: ${detail}`)
  } finally {
    await browser?.close().catch(() => undefined)
  }
}
