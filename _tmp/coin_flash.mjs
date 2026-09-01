import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000)
await page.evaluate("window.__coinReplay()")
const t0 = Date.now()
for (let at = 3200; at <= 4300; at += 150) {
  const wait = at - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  const info = await page.evaluate(() => {
    const card = document.querySelector('[data-guide="home-rank-card"]')
    const cs = card ? getComputedStyle(card) : null
    return { anim: cs?.animationName, shadow: cs?.boxShadow?.slice(0, 60) }
  })
  console.log(`t=${Date.now() - t0}`, JSON.stringify(info))
}
await browser.close()
