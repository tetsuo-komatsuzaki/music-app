import { chromium } from "playwright"
const p = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/karte-hero.html"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 430, height: 3200 }, deviceScaleFactor: 2 })).newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(String(e)))
await pg.goto(p); await pg.waitForTimeout(1800)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/hero_active.png", fullPage: true })
await pg.locator("button[data-s=quiet]").click(); await pg.waitForTimeout(1200)
await pg.screenshot({ path: "C:/Users/tetsu/AppData/Local/Temp/hero_quiet.png", fullPage: true })
console.log("errs:", JSON.stringify(errs))
await b.close()
