import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()

// 事前ウォームアップ (コンパイル済みにして収録中の待ちを消す)
const warm = await browser.newPage({ viewport: { width: 402, height: 870 } })
await warm.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await warm.waitForTimeout(6000)
await warm.goto("http://localhost:3100/dev/coin-demo/demo?two=1", { waitUntil: "domcontentloaded", timeout: 180000 })
await warm.waitForTimeout(6000)
await warm.close()

async function rec(url, name, dur) {
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 870 },
    recordVideo: { dir: `${G}/rec`, size: { width: 402, height: 870 } },
  })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForTimeout(dur)
  const video = page.video()
  await ctx.close()
  const p = await video.path()
  console.log(name, p)
}
await rec("http://localhost:3100/dev/coin-demo/demo", "one", 10000)
await rec("http://localhost:3100/dev/coin-demo/demo?two=1", "two", 12000)
await browser.close()
