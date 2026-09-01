import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=card", { waitUntil: "load" })
await page.waitForTimeout(6000)
// 落下待ち→タップでめくり→表面で静止
await page.mouse.click(201, 430)
await page.waitForTimeout(1800)
await page.screenshot({ path: SP + "/shots/face_card.png" })
await browser.close()
console.log("ok")
