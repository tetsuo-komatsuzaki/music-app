import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
page.on("console", (m) => { const t = m.text(); if (t.includes("[coin]")) console.log(t) })
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000)
await page.evaluate("window.__coinReplay()")
const t0 = Date.now()
for (let at = 1600; at <= 3700; at += 300) {
  const wait = at - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  const info = await page.evaluate(() => {
    const els = document.querySelectorAll("body > div")
    const last = els[els.length - 1]
    const coin = last?.querySelector("img") ? last.firstElementChild : null
    const r = coin?.getBoundingClientRect?.()
    const cs = coin ? getComputedStyle(coin) : null
    return { hasLayer: !!last, coin: !!coin, rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width)] : null, op: cs?.opacity, tf: cs?.transform?.slice(0, 40) }
  })
  console.log(`t=${Date.now() - t0}`, JSON.stringify(info))
  await page.screenshot({ path: `${G}/shots/coin/sweep_${at}.png` })
}
await browser.close()
