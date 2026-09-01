import { chromium } from "playwright"
const HTML = "file:///C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/guide-redesign.html"
const OUT = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/shots/steps"
import * as fs from "fs"
fs.mkdirSync(OUT, { recursive: true })
async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 480, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto(HTML, { waitUntil: "load", timeout: 60000 })
  await page.waitForTimeout(1200)
  const n = await page.evaluate("FLOW.length") as number
  for (let i = 0; i < n; i++) {
    await page.evaluate(`cur=${i};run();`)
    await page.waitForTimeout(700)
    await page.locator("#phone").screenshot({ path: `${OUT}/step_${String(i).padStart(2, "0")}.png` })
  }
  await browser.close()
  console.log("done", n)
}
main().catch((e) => { console.error(e); process.exit(1) })
