import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()

async function rec(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 1,
    recordVideo: { dir: SP + "/rec", size: { width: 402, height: 870 } } })
  const page = await ctx.newPage()
  await fn(page)
  const video = page.video()
  await ctx.close()
  const fs = await import("fs")
  fs.renameSync(await video.path(), `${SP}/rec/${name}`)
  console.log(name, "done")
}

// 結果パネル 段5 (開幕アニメの連鎖)
await rec("rest5_raw.webm", async (page) => {
  await page.goto("http://localhost:3100/dev/result-demo?t=5", { waitUntil: "load" })
  await page.waitForSelector(".aroRup", { timeout: 30000 })
  await page.waitForTimeout(4500)
  await page.evaluate(() => { const sh = document.querySelector('[class*="sheet"]'); if (sh) sh.scrollTo({ top: 900, behavior: "smooth" }) })
  await page.waitForTimeout(2000)
})

// ギャラリー3棚の巡回+拡大
await rec("gtour_raw.webm", async (page) => {
  await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "load" })
  await page.waitForTimeout(5000)
  await page.waitForTimeout(1500)
  await page.getByText("カード", { exact: false }).first().click()
  await page.waitForTimeout(2200)
  await page.getByText("栄誉", { exact: false }).first().click()
  await page.waitForTimeout(2200)
  await page.locator(".glTreasure").nth(2).click()
  await page.waitForTimeout(2200)
  await page.locator(".glZoom").click()
  await page.waitForTimeout(800)
})

await browser.close()
