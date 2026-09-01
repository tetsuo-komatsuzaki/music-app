import { chromium } from "playwright"
const p = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/rankcard-5plans.html"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 410, height: 2600 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto(p); await pg.waitForTimeout(800)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/mock_s3.png", fullPage: true })
await pg.click('button[data-s="10"]'); await pg.waitForTimeout(500)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/mock_s10.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
