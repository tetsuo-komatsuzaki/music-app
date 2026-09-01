import { chromium } from "playwright"
const H = "C:/Users/tetsu/OneDrive/Desktop/EDSP/practice-shiftb-master/treasure-handoff"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/shots"
const browser = await chromium.launch()
for (const [f, out] of [["gallery-screen.html", "ho_gal.png"], ["result-celebration.html", "ho_res.png"]]) {
  const page = await browser.newPage({ viewport: { width: 430, height: 1400 } })
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  await page.goto("file:///" + H + "/" + f, { waitUntil: "load" })
  await page.waitForTimeout(600)
  await page.screenshot({ path: SP + "/" + out, fullPage: true })
  console.log(f, "errors:", errs.length)
  await page.close()
}
await browser.close()
