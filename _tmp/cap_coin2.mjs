import { chromium } from "playwright"
import { pathToFileURL } from "url"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 3 })
await page.goto(pathToFileURL(G + "/coin-motions.html").href)
await page.waitForTimeout(2300)
await page.screenshot({ path: `${G}/shots/impl/coin_v2.png`, clip: { x: 20, y: 130, width: 320, height: 700 } })
await browser.close()
console.log("ok")
