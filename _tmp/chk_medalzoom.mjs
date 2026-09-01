import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "load" })
await page.waitForTimeout(4500)
await page.getByText("栄誉", { exact: false }).first().click()
await page.waitForTimeout(800)
await page.locator(".glTreasure").first().click()
await page.waitForTimeout(600)
await page.screenshot({ path: SP + "/shots/imp_medal_zoom.png" })
await browser.close()
console.log("ok")
