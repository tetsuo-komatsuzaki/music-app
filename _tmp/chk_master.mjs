import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("file:///" + SP + "/gs_master4.html", { waitUntil: "load" })
for (const [ms, name] of [[1500, "a"], [1300, "b"], [1200, "c"], [2500, "d"]]) {
  await page.waitForTimeout(ms)
  await page.screenshot({ path: `${SP}/shots/gsm2_${name}.png` })
}
console.log("errors:", errs.length)
await browser.close()
