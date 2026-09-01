import { chromium } from "playwright"
const base = "http://localhost:3200"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })).newPage()
await pg.goto(base + "/dev/treasure-demo/demo?s=shelves", { waitUntil: "networkidle" })
await pg.waitForTimeout(1200)
// カードタブへ
const tabs = pg.locator(".glTab")
await tabs.nth(1).click()
await pg.waitForTimeout(900)
await pg.screenshot({ path: process.env.TMPDIR + "/cards_tab.png", fullPage: false })
await b.close()
console.log("done")
