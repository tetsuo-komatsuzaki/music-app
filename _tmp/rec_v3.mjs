import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 402, height: 960 },
  recordVideo: { dir: `${G}/rec`, size: { width: 402, height: 960 } },
})
const page = await ctx.newPage()
await page.goto(`file://${G}/genspark_card_v3.html`, { waitUntil: "load" })
await page.waitForTimeout(9000)
const v = page.video()
await ctx.close()
console.log(await v.path())
await browser.close()
