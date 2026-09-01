import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 860, height: 700 }, deviceScaleFactor: 2 })
await page.goto(`file://${G}/reward-album.html`, { waitUntil: "load" })
await page.waitForTimeout(600)
const el = await page.locator(".coinRow")
await el.screenshot({ path: `${G}/shots/coin/album_coins.png` })
await browser.close()
console.log("ok")
