import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const warm = await browser.newPage({ viewport: { width: 402, height: 870 } })
await warm.goto("http://localhost:3100/dev/treasure-demo/demo?s=card", { waitUntil: "domcontentloaded", timeout: 180000 })
await warm.waitForTimeout(6000)
await warm.close()
const ctx = await browser.newContext({
  viewport: { width: 402, height: 870 },
  recordVideo: { dir: `${G}/rec`, size: { width: 402, height: 870 } },
})
const page = await ctx.newPage()
let errs = 0
page.on("pageerror", (e) => { errs++; console.log("pageerror:", String(e).slice(0, 200)) })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=card", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("text=タップでめくる", { timeout: 30000 })
await page.waitForTimeout(1200)
await page.mouse.click(200, 320)
await page.waitForSelector("text=うけとる", { timeout: 15000 })
await page.waitForTimeout(1400)
await page.click("text=うけとる")
await page.waitForTimeout(1600)
const v = page.video()
await ctx.close()
console.log("errors:", errs, await v.path())
await browser.close()
