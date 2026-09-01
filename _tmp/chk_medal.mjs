import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(`file://${G}/treasure-faces.html`, { waitUntil: "load" })
await page.evaluate(() => document.querySelectorAll("h2")[1].scrollIntoView())
await page.evaluate("rp('p3')")
await page.waitForTimeout(2200)
await page.screenshot({ path: `${G}/shots/coin/medal_swing.png` })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${G}/shots/coin/medal_shine.png` })
await browser.close()
console.log("ok")
