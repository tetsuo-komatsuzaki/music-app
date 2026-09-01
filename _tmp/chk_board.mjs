import { chromium } from "playwright"
const SP = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 402, height: 870 } })
const errs = []
page.on("pageerror", (e) => errs.push(String(e)))
await page.goto("http://localhost:3100/dev/treasure-demo/demo?s=card", { waitUntil: "load" })
await page.waitForTimeout(4000)
// カード演出をスキップして消化
try { await page.locator(".caStage, [class*=ca]").first().click({ timeout: 2000 }) } catch {}
await page.waitForTimeout(1000)
try { await page.mouse.click(201, 400) } catch {}
await page.waitForTimeout(1500)
try { await page.mouse.click(201, 700) } catch {}
await page.waitForTimeout(1200)
const board = page.locator('[data-guide="home-quest-board"]')
await board.scrollIntoViewIfNeeded()
await board.locator("button").first().click()
await page.waitForTimeout(600)
await board.screenshot({ path: SP + "/shots/board_lit.png" })
console.log("errors:", errs.length, errs.slice(0, 2))
await browser.close()
