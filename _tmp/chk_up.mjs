import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 940, height: 1000 } })).newPage()
const errs = []; pg.on("pageerror", (e) => errs.push(String(e).slice(0, 140)))
await pg.goto(`file:///${SP}/upside-review.html`, { waitUntil: "load" })
await pg.waitForTimeout(700)
console.log("エラー:", errs.length ? errs : "なし", "表:", await pg.$$eval("table", (e) => e.length))
console.log("横スクロール:", await pg.evaluate(() => document.body.scrollWidth > window.innerWidth))
await b.close()
