import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=0", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
  await page.waitForTimeout(1900)
for (const i of [0, 8, 9, 10, 11, 15, 17]) {
  await page.evaluate(`window.__guideStep(${i})`)
  await page.waitForTimeout(1900)
  await page.screenshot({ path: `${G}/shots/impl/impl_${String(i).padStart(2, "0")}.png` })
}
// step16: 15からランクカードをタップしてシートを開く
await page.evaluate("window.__guideStep(15)")
await page.waitForTimeout(800)
await page.click('[data-guide="home-rank-card"]')
await page.waitForTimeout(2200)
await page.screenshot({ path: `${G}/shots/impl/impl_16.png` })
await browser.close()
console.log("captured")
