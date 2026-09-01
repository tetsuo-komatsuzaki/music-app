import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 }, deviceScaleFactor: 2 })
await page.goto("http://localhost:3100/dev/guide-demo/demo?step=14", { waitUntil: "domcontentloaded", timeout: 240000 })
await page.waitForSelector("[data-guide-overlay]", { state: "attached", timeout: 180000 })
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" })
await page.waitForTimeout(1700)
await page.screenshot({ path: `${G}/shots/impl/v_ring_mid.png` })
await page.waitForTimeout(2600)
await page.screenshot({ path: `${G}/shots/impl/v_ring_done.png` })
await browser.close()
console.log("ok")
