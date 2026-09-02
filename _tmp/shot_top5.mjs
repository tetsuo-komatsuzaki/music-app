import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1180, height: 1200 } })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)))
await pg.goto(`file:///${SP}/karte-top-5.html`, { waitUntil: "load" })
await pg.waitForTimeout(1000)
console.log("エラー:", errs.length ? errs : "なし")
console.log("案:", await pg.$$eval(".case", (e) => e.length), "指板:", await pg.$$eval(".fb svg", (e) => e.length))
// 案3の折りたたみと案4のタブを操作
await pg.locator(".case:nth-child(3) .foldH").first().click()
await pg.locator(".case:nth-child(4) .tab").nth(1).click()
await pg.waitForTimeout(300)
console.log("案3を開いた:", await pg.$$eval(".case:nth-child(3) .foldH[aria-expanded=true]", (e) => e.length))
console.log("案4のタブ2:", await pg.$$eval(".case:nth-child(4) .tp[data-i='1']:not([hidden])", (e) => e.length))
console.log("横スクロール:", await pg.evaluate(() => document.body.scrollWidth > window.innerWidth))
await pg.screenshot({ path: "_tmp/top5.png", fullPage: true })
await b.close()
