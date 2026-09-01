import { chromium } from "playwright"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 430, height: 3400 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto("file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/karte-hero.html")
await pg.waitForTimeout(2400)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/hero2.png", fullPage: true })
await pg.goto("file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/skills-redesign.html")
await pg.waitForTimeout(2200)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/skills.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
