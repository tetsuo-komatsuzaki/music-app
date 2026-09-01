import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(8000)
await page.evaluate(() => { document.querySelectorAll("button").forEach(b => { if (b.textContent === "もう一度") b.remove() }); window.scrollTo(0, 0) })
await page.waitForTimeout(400)
await page.screenshot({ path: `${G}/qbg.png` })
await browser.close()
console.log("ok")
