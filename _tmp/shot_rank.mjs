import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 402, height: 2400 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto("http://localhost:3200/dev/treasure-demo/demo?s=rank", { waitUntil: "networkidle" })
await pg.waitForTimeout(2200)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/rank_impl.png", fullPage: true })
// シートも確認: 1枚目をタップ → 演奏の軌跡 → 宝物の棚ボタン
await pg.locator('[data-guide="home-rank-card"]').first().click()
await pg.waitForTimeout(700)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/rank_sheet.png", fullPage: false })
console.log("errs:", JSON.stringify(errs))
await b.close()
