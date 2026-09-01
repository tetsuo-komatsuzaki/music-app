import { chromium } from "playwright"
const p = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/gallery-carousel.html"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 430, height: 2800 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto(p); await pg.waitForTimeout(900)
// 案1=賞状タブ、案3=称号タブに切り替えて多様性を確認
const cases = pg.locator(".case")
await cases.nth(0).locator('.catTabs button[data-c="賞状"]').click()
await cases.nth(2).locator('.catTabs button[data-c="称号"]').click()
await pg.waitForTimeout(900)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/car_mock2.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
