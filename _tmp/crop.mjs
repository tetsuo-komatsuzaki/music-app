import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad"
const b = await chromium.launch()
const pg = await (await b.newContext({ viewport: { width: 1120, height: 1000 }, deviceScaleFactor: 2 })).newPage()
await pg.goto(`file:///${SP}/karte-hero.html`, { waitUntil: "load" })
await pg.waitForTimeout(1000)
await pg.locator(".phone").first().screenshot({ path: "_tmp/hero_card.png" })
await b.close()
