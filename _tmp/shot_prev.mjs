import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 960, height: 1200 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)))
await pg.goto("http://localhost:3210/dev/skill-preview", { waitUntil: "networkidle" })
await pg.waitForTimeout(2000)
console.log("エラー:", errs.length ? errs : "なし")
console.log("枠:", await pg.$$eval("section", (e) => e.length))
const secs = await pg.$$("section")
for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: `_tmp/prev_${i + 1}.png` })
await pg.screenshot({ path: "_tmp/prev_all.png", fullPage: true })
console.log("撮った:", secs.length)
await b.close()
