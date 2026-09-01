import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 420, height: 1000 }, deviceScaleFactor: 1 })
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })
await page.goto(`file://${G}/genspark_card_v3.html`, { waitUntil: "load" })
for (const t of [1200, 2600, 4000, 5600]) {
  await page.waitForTimeout(t === 1200 ? 1200 : 1400)
  await page.screenshot({ path: `${G}/shots/coin/gs_${t}.png` })
}
console.log("errors:", errs)
await browser.close()
