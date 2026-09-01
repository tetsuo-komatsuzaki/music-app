import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })
page.on("pageerror", (e) => console.log("JS_ERR:", String(e).slice(0, 200)))
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=0", { waitUntil: "domcontentloaded", timeout: 240000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 180000 })
await page.waitForTimeout(1500)
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
for (let i = 0; i < 18; i++) {
  if (i === 16) {
    await page.evaluate("window.__guideStep(15)")
    await page.waitForTimeout(1600)
    await page.click('[data-guide="home-rank-card"]')
    await page.waitForTimeout(2200)
  } else {
    await page.evaluate(`window.__guideStep(${i})`)
    const wait = i === 14 ? 3600 : 1900
    await page.waitForTimeout(wait)
  }
  await page.screenshot({ path: `${G}/shots/impl/impl_${String(i).padStart(2, "0")}.png` })
}
await browser.close()
console.log("all captured")
