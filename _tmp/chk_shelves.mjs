import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 1100 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "load" })
await page.waitForTimeout(5500)
await page.screenshot({ path: SP + "/shots/imp_shelf_coin.png", fullPage: true })
await page.getByText("カード", { exact: false }).first().click()
await page.waitForTimeout(900)
await page.screenshot({ path: SP + "/shots/imp_shelf_card.png", fullPage: true })
await page.getByText("栄誉", { exact: false }).first().click()
await page.waitForTimeout(900)
await page.screenshot({ path: SP + "/shots/imp_shelf_honor.png", fullPage: true })
console.log("errors:", errs.length, errs.slice(0, 3))
await browser.close()
