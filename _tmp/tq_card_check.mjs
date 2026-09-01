import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 300)))
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text().slice(0, 200)) })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=card", { waitUntil: "domcontentloaded", timeout: 180000 })
for (const t of [1500, 3000, 5000]) {
  await page.waitForTimeout(t === 1500 ? 1500 : 1500)
  const has = await page.evaluate(() => document.body.textContent.includes("券面は仮置き"))
  console.log(`t=${t}: overlay=${has}`)
}
await page.screenshot({ path: `${G}/shots/coin/tq_card_probe.png` })
await browser.close()
