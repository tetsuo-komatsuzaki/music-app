import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 402, height: 870 },
  deviceScaleFactor: 1,
  recordVideo: { dir: SP + "/rec", size: { width: 402, height: 870 } },
})
const page = await ctx.newPage()
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()) })
const t0 = Date.now()
const log = (s) => console.log(((Date.now() - t0) / 1000).toFixed(1) + "s", s)
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=title", { waitUntil: "load" })
log("loaded")
await page.waitForSelector(".tiCard", { timeout: 20000 })
log("scroll mounted")
await page.waitForSelector(".tiRecv button", { timeout: 20000 })
log("recv button visible")
await page.waitForTimeout(800)
await page.click(".tiRecv button")
log("clicked")
await page.waitForTimeout(1600)
// 再スタート監視: fly完了後もtiCardが残っていないか
const still = await page.locator(".tiCard").count()
log("tiCard count after fly+1.6s = " + still)
const video = page.video()
await ctx.close()
const p = await video.path()
const fs = await import("fs")
fs.renameSync(p, SP + "/rec/titleimpl_raw.webm")
await browser.close()
console.log("errors:", errs.length, errs.slice(0, 5))
