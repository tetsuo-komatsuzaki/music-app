import { chromium } from "playwright"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 300)))
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 200)) })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=title", { waitUntil: "load" })
await page.waitForTimeout(8000)
const counts = await page.evaluate(() => ({
  tiCard: document.querySelectorAll(".tiCard").length,
  anyTi: document.querySelectorAll('[class^="ti"]').length,
  placeholder: document.body.innerText.includes("券面は仮置き"),
  body: document.body.innerText.slice(0, 120),
}))
console.log(JSON.stringify(counts))
await browser.close()
