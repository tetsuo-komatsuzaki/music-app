import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
page.on("requestfailed", (r) => errs.push("reqfail: " + r.url().slice(0, 80)))
await page.goto("file:///" + SP + "/genspark_nintei_v8.html", { waitUntil: "load" })
for (const [name, ms] of [["na", 1200], ["nb", 1600], ["nc", 2000], ["nd", 1000], ["ne", 800]]) {
  await page.waitForTimeout(ms)
  await page.screenshot({ path: SP + "/shots/gsn_" + name + ".png" })
}
console.log("errors:", errs.length, errs.slice(0, 5))
await browser.close()
