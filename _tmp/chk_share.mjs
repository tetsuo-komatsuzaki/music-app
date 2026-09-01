import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "load" })
await page.waitForTimeout(4500)
await page.getByText("栄誉", { exact: false }).first().click()
await page.waitForTimeout(700)
await page.locator(".glTreasure").nth(2).click()
await page.waitForTimeout(500)
await page.screenshot({ path: SP + "/shots/z_cert_share.png" })
console.log("errors:", errs.length, errs.slice(0, 2))
await browser.close()
