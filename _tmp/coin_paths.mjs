import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1 })
page.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 200)))

// ── 1) スキップ: 演出中 (2.0s) にタップ → 即時最終状態 ──
await page.goto("http://localhost:3100/dev/coin-demo/demo", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(9000)
await page.evaluate("window.__coinReplay()")
await page.waitForTimeout(2000)
await page.mouse.click(200, 400)
await page.waitForTimeout(400)
await page.screenshot({ path: `${G}/shots/coin/skip_after.png` })
const skipState = await page.evaluate(() => ({
  remaining: document.body.textContent.includes("あと9曲"),
  master: document.body.textContent.includes("曲をマスターしよう"),
}))
console.log("skip:", JSON.stringify(skipState))

// ── 2) 軌跡シート: 新コインデザイン + 曲名/達成日ポップ ──
await page.waitForTimeout(500)
await page.click('[data-guide="home-rank-card"]')
await page.waitForTimeout(1500)
await page.screenshot({ path: `${G}/shots/coin/sheet.png` })
const stamp = await page.locator('div[class*="sheet"] button img').count()
console.log("sheet coin imgs:", stamp)
await page.locator('div[class*="sheet"] button').filter({ hasNot: page.locator("nothing") }).first().click().catch(() => {})
await page.waitForTimeout(400)
await page.screenshot({ path: `${G}/shots/coin/sheet_pop.png` })

// ── 3) 2枚同時 (?two=1): 2枚目は中央出現 ──
await page.goto("http://localhost:3100/dev/coin-demo/demo?two=1", { waitUntil: "domcontentloaded", timeout: 180000 })
await page.waitForTimeout(5500)
await page.evaluate("window.__coinReplay()")
const t0 = Date.now()
for (const at of [2400, 3600, 4400, 5200, 6200]) {
  const wait = at - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  await page.screenshot({ path: `${G}/shots/coin/two_${at}.png` })
}
await browser.close()
console.log("done")
