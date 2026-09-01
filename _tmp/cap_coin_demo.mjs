import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 300)))
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000) // 初回再生を完全に流し切る
await page.evaluate("window.__coinReplay()")
const t0 = Date.now()
const frames = [
  ["a_rewind", 400],
  ["b_fill", 1300],
  ["c_pop", 2350],
  ["d_hold", 2700],
  ["e_fly", 3020],
  ["f_flash", 3720],
  ["g_final", 4600],
]
for (const [name, at] of frames) {
  const wait = at - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  await page.screenshot({ path: `${G}/shots/coin/${name}.png` })
}
await browser.close()
console.log("captured")
