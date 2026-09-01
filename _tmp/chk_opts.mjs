import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 850, height: 1000 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("file:///" + SP + "/arco-cert-options.html", { waitUntil: "load" })
await page.waitForTimeout(1500)
await page.screenshot({ path: SP + "/shots/opts_check.png", fullPage: true })
console.log("errors:", errs.length)
await browser.close()
