import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 860, height: 1200 }, deviceScaleFactor: 1 })
await page.goto(`file://${G}/reward-album.html`, { waitUntil: "load" })
await page.waitForTimeout(600)
await page.screenshot({ path: `${G}/shots/coin/album_top.png`, fullPage: false })
await page.evaluate(() => window.scrollTo(0, 1500))
await page.waitForTimeout(300)
await page.screenshot({ path: `${G}/shots/coin/album_mid.png` })
await browser.close()
console.log("ok")
