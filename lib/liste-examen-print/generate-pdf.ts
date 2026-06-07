import { renderListeExamenPrintHtml } from "./render-html"
import type { ListeExamenDto } from "@/lib/api/mappers-liste-examen"
import { LISTE_EXAMEN_PAGE_MARGIN_MM } from "./constants"

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
  const html = renderListeExamenPrintHtml(liste, autoEcoleNom)
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
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: `${LISTE_EXAMEN_PAGE_MARGIN_MM}mm`,
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
