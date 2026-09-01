import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })
await page.goto("https://arcodaviolin.com/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 120000 })
await page.waitForTimeout(4500)
await page.evaluate("window.__coinReplay()")
await page.waitForTimeout(2300)
await page.screenshot({ path: `${G}/shots/coin/prod_pop.png` })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${G}/shots/coin/prod_final.png` })
console.log("prod smoke done, pageerrors:", errs)
await browser.close()
