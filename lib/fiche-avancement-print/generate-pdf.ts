import { ficheAvancementPrintApplyFitScript } from "./apply-fit-script"
import { renderFicheAvancementPrintHtml } from "./render-html"
import type { FicheAvancementData } from "./types"

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

export async function generateFicheAvancementPdf(
  data: FicheAvancementData,
): Promise<Buffer> {
  const html = renderFicheAvancementPrintHtml(data, { forPdf: true })
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
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 })
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
    await page.evaluate(ficheAvancementPrintApplyFitScript())

    const pdf = await page.pdf({
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
