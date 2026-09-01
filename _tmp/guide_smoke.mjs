import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=0", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
for (const i of [0, 9, 15, 18]) {
  await page.evaluate(`window.__guideStep(${i})`)
  await page.waitForTimeout(1500)
}
console.log("guide smoke ok, pageerrors:", errs)
await browser.close()
