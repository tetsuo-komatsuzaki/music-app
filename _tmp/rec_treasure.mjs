import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const warm = await browser.newPage({ viewport: { width: 402, height: 870 } })
for (const s of ["card", "mixed"]) {
  await warm.goto(`http://localhost:3100/dev/treasure-demo/demo?s=${s}`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await warm.waitForTimeout(4500)
}
await warm.close()
async function rec(url, name, dur, taps) {
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 870 },
    recordVideo: { dir: `${G}/rec`, size: { width: 402, height: 870 } },
  })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 })
  for (const [t, x, y] of taps) {
    await page.waitForTimeout(t)
    await page.mouse.click(x, y)
  }
  await page.waitForTimeout(dur)
  const video = page.video()
  await ctx.close()
  console.log(name, await video.path())
}
// card単独: 授与→タップで消える
await rec("http://localhost:3100/dev/treasure-demo/demo?s=card", "t_card", 2500, [[5000, 200, 430]])
// mixed: コイン演出→カード授与→タップ
await rec("http://localhost:3100/dev/treasure-demo/demo?s=mixed", "t_mixed", 2500, [[8200, 200, 430]])
await browser.close()
