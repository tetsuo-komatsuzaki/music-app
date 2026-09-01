import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE_ERR:", m.text().slice(0, 200)) })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=15", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 120000 })
await page.waitForTimeout(600)
const before = await page.evaluate(() => {
  const layer = document.querySelector("[data-guide-overlay]")
  return { parent: layer.parentElement.tagName, parentCls: String(layer.parentElement.className).slice(0, 40) }
})
console.log("layer parent:", JSON.stringify(before))
await page.click('[data-guide="home-rank-card"]')
await page.waitForTimeout(1500)
const info = await page.evaluate(() => {
  const layer = document.querySelector("[data-guide-overlay]")
  const bar = layer.querySelector('[role="status"]')
  const cs = getComputedStyle(bar)
  const modal = document.querySelector('[class*="MyRankCard-module"][class*="modal"], [class*="modal"]')
  return {
    layerParent: layer.parentElement.tagName,
    barZ: cs.zIndex, barPos: cs.position,
    modalZ: modal ? getComputedStyle(modal).zIndex : null,
    modalInBody: modal ? modal.parentElement.tagName : null,
    order: Array.from(document.body.children).map((el) => String(el.className).slice(0, 30) || el.tagName),
  }
})
console.log(JSON.stringify(info, null, 1))
await browser.close()
