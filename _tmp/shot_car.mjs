import { chromium } from "playwright"
const p = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/gallery-carousel.html"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 430, height: 2600 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto(p); await pg.waitForTimeout(900)
// 案1を2つ目までスクロール、案2を1回進める
const cars = pg.locator(".car")
await cars.nth(0).evaluate((el) => { el.scrollLeft = 140 })
await pg.locator('[aria-label="つぎへ"]').click()
await pg.waitForTimeout(900)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/car_mock.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
