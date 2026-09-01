import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=0", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
// ringComplete ステップ (idx15) — リング満了後の行✓/チップ達成を確認
await page.evaluate("window.__guideStep(14)")
await page.waitForTimeout(4200)
await page.screenshot({ path: `${G}/shots/coin/guide_ring_after.png` })
console.log("errors:", errs)
await browser.close()
