import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1180, height: 1200 } })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)))
await pg.goto(`file:///${SP}/karte-hero-5.html`, { waitUntil: "load" })
await pg.waitForTimeout(1200)
console.log("エラー:", errs.length ? errs : "なし")
console.log("案の数:", await pg.$$eval(".case", (e) => e.length))
console.log("横スクロール:", await pg.evaluate(() => document.body.scrollWidth > window.innerWidth))
await pg.screenshot({ path: "_tmp/hero5.png", fullPage: true })
await b.close()
