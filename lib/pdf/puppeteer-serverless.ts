import type { Browser } from "puppeteer-core"

/** Pack Chromium hébergé sur GitHub (requis par @sparticuz/chromium-min sur Vercel). */
export const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim() ||
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar"

async function resolveLocalChromePath(): Promise<string | null> {
  const fromEnv = process.env.CHROME_EXECUTABLE_PATH?.trim()
  if (fromEnv) return fromEnv

  const { existsSync } = await import("fs")
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
          ]

  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return null
}

function shouldUseLocalChrome(): boolean {
  if (process.env.VERCEL === "1") return false
  if (process.env.PDF_USE_LOCAL_CHROME === "1") return true
  return process.env.NODE_ENV !== "production"
}

/** Lance Chromium pour PDF serverless (Vercel) ou Chrome local en dev. */
export async function launchServerlessBrowser(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core")

  if (shouldUseLocalChrome()) {
    const localChrome = await resolveLocalChromePath()
    if (localChrome) {
      return puppeteer.default.launch({
        executablePath: localChrome,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }
  }

  const chromium = await import("@sparticuz/chromium-min")
  chromium.default.setGraphicsMode = false
  const executablePath = await chromium.default.executablePath(CHROMIUM_PACK_URL)

  return puppeteer.default.launch({
    args: chromium.default.args,
    executablePath,
    headless: "shell",
  })
}
