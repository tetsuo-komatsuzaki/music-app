import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("file:///" + SP + "/gs_ret2.html", { waitUntil: "load" })
await page.waitForTimeout(600)
for (const [label, name] of [["2 自己ベスト", "t2"], ["3 達成", "t3"], ["4 マスター", "t4"], ["5 ランクアップ", "t5"]]) {
  await page.getByText(label, { exact: false }).first().click()
  await page.waitForTimeout(1600)
  await page.screenshot({ path: `${SP}/shots/ret_res_${name}.png`, fullPage: true })
}
console.log("errors:", errs.length)
await browser.close()
