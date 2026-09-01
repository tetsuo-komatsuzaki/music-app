import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
for (const [s, sel, name] of [["title", ".tiRecv", "rz_title"], ["mcard", ".mcRecv", "rz_mcard"]]) {
  const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  await page.goto(`http://localhost:3100/dev/treasure-demo/demo?s=${s}`, { waitUntil: "load" })
  await page.waitForSelector(sel + " button", { timeout: 30000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SP}/shots/${name}.png` })
  console.log(name, "errors:", errs.length)
  await page.close()
}
await browser.close()
