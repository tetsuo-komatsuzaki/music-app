import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=15", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { timeout: 120000 })
  await page.waitForTimeout(800)
await page.click('[data-guide="home-rank-card"]')
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const layer = document.querySelector("[data-guide-overlay]")
  const bar = layer && layer.querySelector('[role="status"]')
  const modal = Array.from(document.body.children).map((el) => ({
    tag: el.tagName, cls: String(el.className).slice(0, 60),
    z: getComputedStyle(el).zIndex, pos: getComputedStyle(el).position,
  }))
  const barCs = bar ? getComputedStyle(bar) : null
  return {
    layerParent: layer ? layer.parentElement.tagName : null,
    barZ: barCs ? barCs.zIndex : null, barPos: barCs ? barCs.position : null,
    bodyChildren: modal,
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
