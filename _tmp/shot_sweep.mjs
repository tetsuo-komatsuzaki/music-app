import { chromium } from "playwright"
const p = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/rankcard-5plans.html"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 410, height: 2400 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto(p)
await pg.waitForTimeout(1900)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/sweep_t2.png", fullPage: true })
await pg.waitForTimeout(2400)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/sweep_t4.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
