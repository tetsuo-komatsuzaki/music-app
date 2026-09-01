import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1,
  recordVideo: { dir: SP + "/rec", size: { width: 402, height: 870 } } })
const page = await ctx.newPage()
await page.goto("file:///" + SP + "/genspark_nintei_v8.html", { waitUntil: "load" })
await page.waitForTimeout(9000)
const video = page.video()
await ctx.close()
const fs = await import("fs")
fs.renameSync(await video.path(), SP + "/rec/ninteiv8_raw.webm")
await browser.close()
console.log("done")
