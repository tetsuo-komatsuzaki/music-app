import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto("http://localhost:3200/dev/treasure-demo/demo?s=shelves", { waitUntil: "networkidle" })
await pg.waitForTimeout(1500)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/ci_coin.png" })
// コインを1つ左へスクロールして中央切替を確認
await pg.locator(".glCar").first().evaluate((el) => { el.scrollLeft -= 130 })
await pg.waitForTimeout(700)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/ci_coin2.png" })
await pg.getByText("称号", { exact: false }).first().click(); await pg.waitForTimeout(900)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/ci_title.png" })
await pg.getByText("賞状", { exact: false }).first().click(); await pg.waitForTimeout(900)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/ci_honor.png" })
console.log("errs:", JSON.stringify(errs))
await b.close()
