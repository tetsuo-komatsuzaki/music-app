import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1180, height: 1200 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)))
await pg.goto(`file:///${SP}/karte-top.html`, { waitUntil: "load" })
await pg.waitForTimeout(1000)
console.log("エラー:", errs.length ? errs : "なし")
console.log("カード:", await pg.$$eval(".phone", (e) => e.length), "指板:", await pg.$$eval(".fb svg", (e) => e.length))
console.log("横スクロール:", await pg.evaluate(() => document.body.scrollWidth > window.innerWidth))
await pg.locator(".phone").first().screenshot({ path: "_tmp/top_card.png" })
await b.close()
