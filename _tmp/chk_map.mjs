import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 980, height: 1400 }, deviceScaleFactor: 1 })
await page.goto(`file://${G}/reward-map.html`, { waitUntil: "load" })
await page.waitForTimeout(500)
await page.screenshot({ path: `${G}/shots/coin/map_check.png`, fullPage: true })
await browser.close()
console.log("ok")
