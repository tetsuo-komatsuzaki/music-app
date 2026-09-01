import { chromium } from "playwright"
import { pathToFileURL } from "url"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const STEPS = [16]
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 420, height: 940 } })
await page.goto(pathToFileURL(G + "/guide-redesign.html").href)
await page.waitForTimeout(1200)
for (const i of STEPS) {
  await page.evaluate(`cur=${i};run();`)
  await page.waitForTimeout(i === 16 ? 2000 : 900)
  await page.locator(".phone").first().screenshot({ path: `${G}/shots/steps/step_${String(i).padStart(2, "0")}.png` })
}
await browser.close()
console.log("done")
