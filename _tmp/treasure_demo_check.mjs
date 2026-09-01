import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })

// mixed: コイン1→カード2 (3件中2つ再生+1つ棚)
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=mixed", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000)
await page.evaluate("window.__treasureReplay()")
await page.waitForTimeout(4600)
await page.screenshot({ path: `${G}/shots/coin/tq_mixed_card.png` })
await page.mouse.click(200, 430)
await page.waitForTimeout(500)
await page.screenshot({ path: `${G}/shots/coin/tq_mixed_after.png` })

// shelves
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${G}/shots/coin/tq_shelves_coin.png` })
await page.click("text=カード 4")
await page.waitForTimeout(400)
await page.screenshot({ path: `${G}/shots/coin/tq_shelves_card.png` })
await page.click("text=栄誉 2")
await page.waitForTimeout(400)
await page.screenshot({ path: `${G}/shots/coin/tq_shelves_honor.png` })
console.log("done, pageerrors:", errs)
await browser.close()
