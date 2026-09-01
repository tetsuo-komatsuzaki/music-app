import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(`file://${G}/treasure-faces.html`, { waitUntil: "load" })
await page.waitForTimeout(600)
await page.screenshot({ path: `${G}/shots/coin/faces_top.png` })
await page.evaluate(() => document.querySelector("h2:nth-of-type(2)").scrollIntoView())
await page.evaluate("rp('p1'); rp('p2')")
await page.waitForTimeout(3400)
await page.screenshot({ path: `${G}/shots/coin/faces_motion.png` })
await browser.close()
console.log("ok")
