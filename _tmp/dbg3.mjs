import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=15", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
await page.waitForTimeout(800)
await page.click('[data-guide="home-rank-card"]')
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const el = document.elementFromPoint(221, 757)
  const chain = []
  let n = el
  while (n && n !== document.body) { chain.push((n.className && String(n.className).slice(0, 40)) || n.tagName); n = n.parentElement }
  const bar = document.querySelector("[data-guide-overlay] [role=status]")
  const r = bar.getBoundingClientRect()
  return { topElementChain: chain, barRect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
