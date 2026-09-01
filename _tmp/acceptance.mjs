// 検収表11パターンの一括実機検証 (本番ビルド・port引数)
import { chromium } from "playwright"
const PORT = process.argv[2] || "3200"
const BASE = `http://localhost:${PORT}`
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const results = []

async function run(name, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 870 }, ...(opts.reduced ? { reducedMotion: "reduce" } : {}) })
  const page = await ctx.newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 140)))
  const t0 = Date.now()
  let note = ""
  try {
    note = (await fn(page)) || ""
    results.push({ name, ok: errs.length === 0, ms: Date.now() - t0, errs, note })
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, errs: [...errs, String(e).slice(0, 140)], note })
  }
  await ctx.close()
}

const wait = (p, ms) => p.waitForTimeout(ms)

// 1 カード単独
await run("1 カード授与", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=card`, { waitUntil: "load" })
  const t0 = Date.now()
  await p.waitForSelector(".caStage, [class*=ca]", { timeout: 15000 })
  const chunk = Date.now() - t0
  await wait(p, 2200); await p.mouse.click(201, 430)  // めくり
  await wait(p, 1600); await p.mouse.click(201, 700)  // うけとる
  await wait(p, 1500)
  return `チャンク遅延${chunk}ms`
})
// 2 混在直列+棚あふれ
await run("2 混在直列 (最大2つ・棚あふれ)", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=mixed`, { waitUntil: "load" })
  await wait(p, 14000)
  for (let i = 0; i < 6; i++) { await p.mouse.click(201, 500); await wait(p, 1200) }
  await wait(p, 2000)
})
// 3 コインのみ
await run("3 コイン2枚 (宝物は棚へ)", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=coins`, { waitUntil: "load" })
  await wait(p, 12000); await p.mouse.click(201, 500); await wait(p, 2500)
})
// 4-8 授与モーション各種
for (const [num, s, sel] of [["5", "cert", ".ceRecv"], ["6", "nintei", ".niRecv"], ["7", "title", ".tiRecv"]]) {
  await run(`${num} ${s} 授与`, async (p) => {
    await p.goto(`${BASE}/dev/treasure-demo/demo?s=${s}`, { waitUntil: "load" })
    await p.waitForSelector(`${sel} button`, { timeout: 25000 })
    await wait(p, 400)
    await p.click(`${sel} button`)
    await wait(p, 1500)
    const left = await p.evaluate(() => document.querySelectorAll('[class*="Stage"]').length)
    return `残骸${left}`
  })
}
// 9 ギャラリー3棚+拡大+シェア導線
await run("9 ギャラリー3棚+拡大", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=shelves`, { waitUntil: "load" })
  await wait(p, 3000)
  await p.getByText("称号", { exact: false }).first().click(); await wait(p, 700)
  await p.getByText("賞状", { exact: false }).first().click(); await wait(p, 700)
  await p.locator(".glTreasure").nth(0).click(); await wait(p, 500)
  const share = await p.locator(".glShareBtn").count()
  await p.locator(".glZoom").click(); await wait(p, 400)
  await p.screenshot({ path: `${SP}/shots/acc_shelves.png` })
  return `シェアボタン${share}`
})
// 10 結果パネル5段
await run("10 結果パネル祝い階層 t1-5", async (p) => {
  for (const t of [1, 2, 3, 4, 5]) {
    await p.goto(`${BASE}/dev/result-demo?t=${t}`, { waitUntil: "load" })
    await wait(p, 2500)
  }
  await p.screenshot({ path: `${SP}/shots/acc_result.png` })
})
// 11 新クエストボード
await run("11 新クエストボード", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=card`, { waitUntil: "load" })
  await wait(p, 3500)
  await p.mouse.click(201, 430); await wait(p, 1200)
  await p.mouse.click(201, 700); await wait(p, 1800)
  const board = p.locator('[data-guide="home-quest-board"]')
  await board.scrollIntoViewIfNeeded()
  await board.locator("button").first().click(); await wait(p, 500)
  const rows = await board.locator("button").count()
  await board.screenshot({ path: `${SP}/shots/acc_board.png` })
  return `行数${rows - 1}`
})
// 12 reduced-motion (演出省略・即消化)
await run("12 reduced-motion (即消化)", async (p) => {
  await p.goto(`${BASE}/dev/treasure-demo/demo?s=card`, { waitUntil: "load" })
  await wait(p, 4000)
  const overlays = await p.evaluate(() => document.querySelectorAll('[class*="caStage"]').length)
  return `演出レイヤー${overlays} (0=省略済)`
}, { reduced: true })

console.log(JSON.stringify(results, null, 1))
await browser.close()
