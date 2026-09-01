import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto("http://localhost:3200/dev/karte-noteacher", { waitUntil: "networkidle", timeout: 60000 })
await pg.waitForTimeout(2000)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/karte_nt.png", fullPage: true })
await pg.goto("http://localhost:3200/dev/treasure-demo/demo?s=album", { waitUntil: "networkidle" })
await pg.waitForTimeout(1200)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/album.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
