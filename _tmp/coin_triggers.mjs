import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 200)))
for (const trig of ["run", "lesson", "etude"]) {
  await page.goto(`http://localhost:3100/dev/coin-demo/demo?trigger=${trig}`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForTimeout(trig === "run" ? 8000 : 5500)
  await page.evaluate("window.__coinReplay()")
  const t0 = Date.now()
  // 巻き戻し(0.4s)と、満了+コイン出現直後(2.3s)を撮る
  for (const [tag, at] of [["a", 400], ["b", 2300]]) {
    const wait = at - (Date.now() - t0)
    if (wait > 0) await page.waitForTimeout(wait)
    await page.screenshot({ path: `${G}/shots/coin/trig_${trig}_${tag}.png` })
  }
}
await browser.close()
console.log("done")
