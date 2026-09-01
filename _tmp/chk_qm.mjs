import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`file://${G}/quest-motion.html`, { waitUntil: "load" })
for (const [n, t] of [["qm_fall", 900], ["qm_lead", 2200], ["qm_front", 3600], ["qm_recv", 4600], ["qm_fly", 5700]]) {
  const wait = t - 0
  await page.waitForTimeout(n === "qm_fall" ? 900 : 0)
  if (n !== "qm_fall") { /* sequential absolute */ }
  await page.screenshot({ path: `${G}/shots/coin/${n}.png` })
  if (n === "qm_fall") await page.waitForTimeout(1300)
  else if (n === "qm_lead") await page.waitForTimeout(1400)
  else if (n === "qm_front") await page.waitForTimeout(1000)
  else if (n === "qm_recv") await page.waitForTimeout(1100)
}
await browser.close()
console.log("ok")
