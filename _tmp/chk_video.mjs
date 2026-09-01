import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 760, height: 900 } })
await page.goto(`file://${G}/coin-impl-motion.html`, { waitUntil: "load", timeout: 120000 })
await page.evaluate(() => document.querySelectorAll("video").forEach(v => { v.currentTime = 2.6; v.pause() }))
await page.waitForTimeout(800)
await page.screenshot({ path: `${G}/shots/coin/video_check.png` })
await browser.close()
console.log("ok")
