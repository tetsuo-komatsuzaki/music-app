import { chromium } from "playwright"
import { pathToFileURL } from "url"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const N = 19
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 420, height: 940 } })
await page.goto(pathToFileURL(G + "/guide-redesign.html").href)
await page.waitForTimeout(1200)
for (let i = 0; i < N; i++) {
  await page.evaluate(`cur=${i};run();`)
  const wait = (i === 2 || i === 12) ? 4200 : (i === 14) ? 3400 : (i === 16) ? 2000 : 900
  await page.waitForTimeout(wait)
  await page.locator(".phone").first().screenshot({ path: `${G}/shots/steps/step_${String(i).padStart(2, "0")}.png` })
}
await browser.close()
console.log("done", N)
