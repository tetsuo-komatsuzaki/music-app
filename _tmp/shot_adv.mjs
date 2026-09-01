import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 430, height: 3000 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto("file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/growth-advice.html")
await pg.waitForTimeout(2600)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/advice.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
