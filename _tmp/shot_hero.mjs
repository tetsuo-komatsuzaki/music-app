import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1120, height: 1400 } })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)))
await pg.goto(`file:///${SP}/karte-hero.html`, { waitUntil: "load" })
await pg.waitForTimeout(1200)
console.log("エラー:", errs.length ? errs : "なし")
console.log("カード:", await pg.$$eval(".phone", (e) => e.length), "レーダー:", await pg.$$eval(".radar svg", (e) => e.length))
// 部位カードを開く
for (const b2 of await pg.$$(".phone:nth-child(1) .partHead")) await b2.click()
await pg.waitForTimeout(400)
console.log("開いた内訳行:", await pg.$$eval(".phone:nth-child(1) .partHead[aria-expanded=true] + .partBody .mini", (e) => e.length))
console.log("横スクロール:", await pg.evaluate(() => document.body.scrollWidth > window.innerWidth))
await pg.screenshot({ path: "_tmp/hero_v2.png", fullPage: true })
await b.close()
