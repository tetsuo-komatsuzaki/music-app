import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()

// ── モック 案A: file:// で開き rp('pa') から位相どおりに撮影 ──
const mp = await browser.newPage({ viewport: { width: 1120, height: 900 }, deviceScaleFactor: 1 })
await mp.goto(`file://${G}/coin-motions.html`, { waitUntil: "load", timeout: 120000 })
await mp.waitForTimeout(1500)
const MOCK_FRAMES = [["1_rewind", 200], ["2_fill", 1100], ["3_pop", 2100], ["4_fly", 2780], ["5_flash", 3450], ["6_final", 4600]]
await mp.evaluate("rp('pa')")
const m0 = Date.now()
for (const [name, at] of MOCK_FRAMES) {
  const wait = at - (Date.now() - m0)
  if (wait > 0) await mp.waitForTimeout(wait)
  await mp.locator("#pa").screenshot({ path: `${G}/shots/coincmp/mock_${name}.png` })
}
await mp.close()

// ── 実装 (/dev/coin-demo): 実測タイムライン基準の同位相で撮影 ──
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000)
const IMPL_FRAMES = [["1_rewind", 300], ["2_fill", 1250], ["3_pop", 2250], ["4_fly", 3000], ["5_flash", 3800], ["6_final", 4800]]
await page.evaluate("window.__coinReplay()")
const t0 = Date.now()
for (const [name, at] of IMPL_FRAMES) {
  const wait = at - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  await page.screenshot({ path: `${G}/shots/coincmp/impl_${name}.png` })
}
await browser.close()
console.log("cmp captured")
