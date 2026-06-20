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

async function resolveExecutablePath(): Promise<string> {
  if (process.env.CHROME_EXECUTABLE_PATH?.trim()) {
    return process.env.CHROME_EXECUTABLE_PATH.trim()
  }

  if (process.env.NODE_ENV === "development") {
    const win = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    const winX86 = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    const { existsSync } = await import("fs")
    if (existsSync(win)) return win
    if (existsSync(winX86)) return winX86
    if (process.platform === "darwin") {
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    }
    return "/usr/bin/google-chrome"
  }

  const chromium = await import("@sparticuz/chromium")
  return chromium.default.executablePath()
}

export async function generateListeExamenPdf(
  liste: ListeExamenDto,
  autoEcoleNom?: string,
): Promise<Buffer> {
  const html = renderListeExamenPrintHtml(liste, autoEcoleNom, { skipClientFit: true })
  const puppeteer = await import("puppeteer-core")

  let launchArgs: string[] = ["--no-sandbox", "--disable-setuid-sandbox"]
  let executablePath = await resolveExecutablePath()

  if (process.env.NODE_ENV !== "development") {
    const chromium = await import("@sparticuz/chromium")
    launchArgs = chromium.default.args
    executablePath = await chromium.default.executablePath()
  }

  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: launchArgs,
  })

  try {
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
  } finally {
    await browser.close()
  }
}
