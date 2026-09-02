import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1140, height: 1000 }, deviceScaleFactor: 1.5 })).newPage()
const errs = []; pg.on("pageerror", (e) => errs.push(String(e).slice(0, 140)))
await pg.goto(`file:///${SP}/plan-popup.html`, { waitUntil: "load" })
await pg.waitForTimeout(900)
console.log("エラー:", errs.length ? errs : "なし", "案:", await pg.$$eval(".case", (e) => e.length))
await pg.screenshot({ path: "_tmp/plan5.png", fullPage: true })
await b.close()
