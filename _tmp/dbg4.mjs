import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=15", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
const info = await page.evaluate(() => {
  const layer = document.querySelector("[data-guide-overlay]")
  const cs = getComputedStyle(layer)
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]))
  return pick(cs, ["position", "zIndex", "transform", "filter", "isolation", "contain", "opacity", "willChange", "mixBlendMode", "containerType"])
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
