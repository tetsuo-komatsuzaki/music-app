import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
for (const t of ["2", "5"]) {
  const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  await page.goto(`http://localhost:3100/dev/result-demo?t=${t}`, { waitUntil: "load" })
  await page.waitForTimeout(6000)
  await page.evaluate(() => { const sh = document.querySelector('[class*="sheet"]'); if (sh) sh.scrollTop = 0 })
  await page.screenshot({ path: `${SP}/shots/imp_res_t${t}.png` })
  console.log("t" + t, "errors:", errs.length, errs.slice(0, 2))
  await page.close()
}
await browser.close()
