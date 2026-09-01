import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { chromium, type Page } from "playwright"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const OUT = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/shots"
const SID = "cmodn88ai0000xcjyogzp2v32"
const SUID = "85555ce4-6822-4efb-8af6-c2a8eda145f0"
const EMAIL = "tetsuo.komatsuzaki@tmdi.jp"
async function dismissAll(page: Page) {
  for (let i = 0; i < 5; i++) {
    const sk = page.getByText("スキップ", { exact: true })
    if (await sk.count()) { try { await sk.first().click({ timeout: 2000 }) } catch { break } await page.waitForTimeout(900) }
    else break
  }
}
async function main() {
  const { data: link } = await supa.auth.admin.generateLink({ type: "magiclink", email: EMAIL })
  const url = (link!.properties as { action_link: string }).action_link
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 })
  await page.waitForTimeout(2000)
  const hs = new URLSearchParams(new URL(page.url()).hash.slice(1))
  const ref = new URL(process.env.SUPABASE_URL!).hostname.split(".")[0]
  const session = { access_token: hs.get("access_token"), token_type: "bearer", expires_in: 3600,
    expires_at: Number(hs.get("expires_at")), refresh_token: hs.get("refresh_token"),
    user: { id: SUID, aud: "authenticated", role: "authenticated", email: EMAIL } }
  await ctx.addCookies([{ name: `sb-${ref}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
    domain: "arcodaviolin.com", path: "/", secure: true, sameSite: "Lax" }])
  await page.goto(`https://arcodaviolin.com/${SUID}/scores/${SID}`, { waitUntil: "networkidle", timeout: 90000 })
  await page.waitForTimeout(9000)
  await dismissAll(page)
  try { await page.getByText("ふりかえり", { exact: true }).first().click({ timeout: 4000 }) } catch {}
  await page.waitForTimeout(6000)
  await dismissAll(page)
  await page.mouse.wheel(0, 240); await page.waitForTimeout(1200)
  await dismissAll(page)
  await page.mouse.click(195, 629)   // モーダルを開く
  await page.waitForTimeout(2500)
  // モーダル内の色つきセルを探してクリック (赤→青→紫の優先)
  const picked = await page.evaluate(() => {
    const targets = ["rgb(226, 106, 93)", "rgb(94, 151, 221)", "rgb(180, 120, 207)"]
    const all = Array.from(document.querySelectorAll<HTMLElement>("*"))
    for (const want of targets) {
      const hit = all.filter((e) => {
        const r = e.getBoundingClientRect()
        if (r.width < 6 || r.width > 40 || r.height < 6 || r.height > 40) return false
        return getComputedStyle(e).backgroundColor === want
      })
      if (hit.length) { hit[0].click(); return want + " x" + hit.length }
    }
    return "none"
  })
  console.log("cell:", picked)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: OUT + "/81_real_detail.png" })
  await page.mouse.wheel(0, 300); await page.waitForTimeout(800)
  await page.screenshot({ path: OUT + "/82_real_detail2.png" })
  await browser.close()
  console.log("done14")
}
main().catch((e) => { console.error(e); process.exit(1) })
