import { chromium } from "playwright"
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master".replace(/c--.*$/, "") // noop
const D = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
await page.goto(`file://${D}/treasure-faces.html`, { waitUntil: "load" })
await page.evaluate("rp('p2')")
await page.waitForTimeout(3000)
const info = await page.evaluate(() => {
  const w = document.querySelector("#p2 .scrollw")
  const p = document.querySelector("#p2 .paper")
  const cs = getComputedStyle(w), ps = getComputedStyle(p)
  return { wOpacity: cs.opacity, wTransform: cs.transform.slice(0, 40), pHeight: ps.height, anims: p.getAnimations().length, wAnims: w.getAnimations().map(a => a.animationName) }
})
console.log(JSON.stringify(info))
await browser.close()
