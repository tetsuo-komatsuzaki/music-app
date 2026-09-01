import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
for (const [f, pref, shots] of [
  ["gs_ret1.html", "gal", [[900, "a"], [1500, "b"]]],
  ["gs_ret2.html", "res", [[900, "a"], [1500, "b"], [2000, "c"], [2000, "d"]]],
]) {
  const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e)))
  page.on("requestfailed", (r) => errs.push("req: " + r.url().slice(0, 90)))
  await page.goto("file:///" + SP + "/" + f, { waitUntil: "load" })
  for (const [ms, name] of shots) {
    await page.waitForTimeout(ms)
    await page.screenshot({ path: `${SP}/shots/ret_${pref}_${name}.png`, fullPage: name === "b" && pref === "gal" })
  }
  console.log(f, "errors:", errs.length, errs.slice(0, 4))
  await page.close()
}
await browser.close()
