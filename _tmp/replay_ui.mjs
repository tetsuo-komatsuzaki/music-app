import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"
import { execSync } from "child_process"
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const G = "C:/Users/tetsu/AppData/Local/Temp/claude/c--Users-tetsu-OneDrive-Desktop-EDSP-practice-shiftb-master/c220253c-6246-4aa2-88c5-4460cc464d09/scratchpad/guide/shots"
const SUID = "a0952076-2a93-4270-876d-0d8ece45a647"
const EMAIL = "tetsuo.komatsuzaki@tmnf.jp"
const { data: link } = await supa.auth.admin.generateLink({ type: "magiclink", email: EMAIL })
const url = link.properties.action_link
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 })
await page.waitForTimeout(1500)
const hs = new URLSearchParams(new URL(page.url()).hash.slice(1))
const ref = new URL(process.env.SUPABASE_URL).hostname.split(".")[0]
const session = { access_token: hs.get("access_token"), token_type: "bearer", expires_in: 3600,
  expires_at: Number(hs.get("expires_at")), refresh_token: hs.get("refresh_token"),
  user: { id: SUID, aud: "authenticated", role: "authenticated", email: EMAIL } }
await ctx.addCookies([{ name: `sb-${ref}-auth-token`,
  value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
  domain: "arcodaviolin.com", path: "/", secure: true, sameSite: "Lax" }])
await page.goto(`https://arcodaviolin.com/${SUID}`, { waitUntil: "networkidle", timeout: 90000 })
await page.waitForTimeout(5000)
const t1 = await page.locator("[data-guide-tutorial]").count()
console.log("完了状態でのチュートリアル表示:", t1, "(0が期待値)")
// もう一度見る相当: DBリセット→同一セッションで location.assign リロード
execSync("npx tsx _tmp/replay_reset.ts", { stdio: "inherit" })
await page.evaluate((u) => window.location.assign(`/${u}`), SUID)
await page.waitForTimeout(9000)
const t2 = await page.locator("[data-guide-tutorial]").count()
console.log("リセット→assignリロード後のチュートリアル表示:", t2, "(1が期待値)")
await page.screenshot({ path: G + "/replay_after.png" })
await browser.close()
