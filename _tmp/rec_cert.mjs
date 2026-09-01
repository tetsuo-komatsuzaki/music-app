// 証明書v6: 正本HTML + 実装デモ (?s=cert) をそれぞれ録画する
import { chromium } from "playwright"
import path from "path"
import { fileURLToPath } from "url"

const here = 'C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide'
const recDir = path.join(here, "rec")

async function record(name, urlOrFile, actions) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 870 },
    deviceScaleFactor: 1,
    recordVideo: { dir: recDir, size: { width: 402, height: 870 } },
  })
  const page = await ctx.newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  await page.goto(urlOrFile, { waitUntil: "load" })
  await actions(page)
  const video = page.video()
  await ctx.close()
  const p = await video.path()
  const fs = await import("fs")
  const dest = path.join(recDir, name)
  fs.renameSync(p, dest)
  await browser.close()
  console.log(name, "errors:", errs.length, errs.slice(0, 3))
}

// 1) 正本v6 (8秒ループを1周ちょい)
await record("certv6_raw.webm", "file:///" + path.join(here, "genspark_cert_v6.html").replaceAll("\\", "/"), async (page) => {
  await page.waitForTimeout(9000)
})

// 2) 実装デモ: 読込安定待ち→自動 (fall2.25+open2.8)→recv出現後うけとるをタップ→fly
await record("certimpl_raw.webm", "http://localhost:3100/dev/treasure-demo/demo?s=cert", async (page) => {
  await page.waitForTimeout(6000) // devチャンク読込の安定待ち (過去の教訓)
  await page.evaluate(() => window.__treasureReplay && window.__treasureReplay())
  await page.waitForTimeout(5600) // fall+open
  const btn = page.locator(".ceRecv button")
  try {
    await btn.click({ timeout: 3000 })
  } catch {}
  await page.waitForTimeout(1400)
})
