import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("file:///" + SP + "/gs_ret1.html", { waitUntil: "load" })
await page.waitForTimeout(700)
const tabs = await page.locator("button, [role=tab], .tab").all()
console.log("clickables:", tabs.length)
const labels = []
for (const t of tabs) labels.push((await t.textContent())?.trim().slice(0, 12))
console.log(labels.join(" | "))
// カード
await page.getByText("カード", { exact: false }).first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: SP + "/shots/ret_gal_cards.png", fullPage: true })
await page.getByText("栄誉", { exact: false }).first().click()
await page.waitForTimeout(700)
await page.screenshot({ path: SP + "/shots/ret_gal_honor.png", fullPage: true })
await browser.close()
console.log("done")
