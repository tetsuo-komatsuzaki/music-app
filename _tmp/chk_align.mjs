import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=shelves", { waitUntil: "load" })
await page.waitForTimeout(4500)

async function measure(tab) {
  const rows = await page.evaluate(() => {
    const out = []
    for (const ped of document.querySelectorAll(".glPed")) {
      const tag = ped.querySelector(".glPedTag")
      const face = ped.querySelector(".tfBox") || ped.querySelector('[class*="coin"]')
      const base = ped.querySelector(".glPedestal") || tag
      if (!face || !base) continue
      const f = face.getBoundingClientRect()
      const b = base.getBoundingClientRect()
      const p = ped.getBoundingClientRect()
      out.push({
        tag: tag ? tag.textContent.trim().slice(0, 12) : "?",
        faceCx: Math.round(f.x + f.width / 2),
        baseCx: Math.round(b.x + b.width / 2),
        pedCx: Math.round(p.x + p.width / 2),
        faceW: Math.round(f.width), faceH: Math.round(f.height),
      })
    }
    // カードグリッドのミニ
    for (const m of document.querySelectorAll(".glMini")) {
      const r = m.getBoundingClientRect()
      out.push({ tag: "mini:" + (m.textContent || "").slice(0, 8), faceCx: Math.round(r.x + r.width / 2), baseCx: null, pedCx: null, faceW: Math.round(r.width), faceH: Math.round(r.height) })
    }
    return out
  })
  console.log("==", tab)
  for (const r of rows) console.log(JSON.stringify(r))
}

await measure("coin")
await page.screenshot({ path: SP + "/shots/al_coin.png", fullPage: true })
await page.getByText("カード", { exact: false }).first().click()
await page.waitForTimeout(700)
await measure("card")
await page.getByText("栄誉", { exact: false }).first().click()
await page.waitForTimeout(700)
await measure("honor")
await page.screenshot({ path: SP + "/shots/al_honor.png", fullPage: true })
await browser.close()
