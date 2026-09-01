import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
const logs = []
page.on("console", (m) => { const t = m.text(); if (t.includes("[coin]")) logs.push(`${Date.now()} ${t}`) })
page.on("pageerror", (e) => logs.push("pageerror: " + String(e).slice(0, 200)))
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(7000)
logs.push("---- replay ----")
await page.evaluate("window.__coinReplay()")
await page.waitForTimeout(6000)
console.log(logs.join("\n"))
await browser.close()
