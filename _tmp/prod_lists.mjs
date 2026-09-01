import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(SB_URL).hostname.split(".")[0]
const sb = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb.auth.admin.generateLink({ type: "magiclink", email: "tetsuo9293@gmail.com" })
const verify = new URL(data.properties.action_link); verify.searchParams.set("redirect_to", "http://localhost/ok")
const res = await fetch(verify.toString(), { redirect: "manual" })
const h = new URLSearchParams((res.headers.get("location") || "").split("#")[1] || "")
const { data: u } = await sb.auth.getUser(h.get("access_token"))
const session = { access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), token_type: "bearer",
  expires_in: Number(h.get("expires_in") || 3600), expires_at: Number(h.get("expires_at")), user: u.user }
const val = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64")
const name = `sb-${ref}-auth-token`, CH = 3180, cookies = []
if (val.length <= CH) cookies.push({ name, value: val })
else for (let i = 0, n = 0; i < val.length; i += CH, n++) cookies.push({ name: `${name}.${n}`, value: val.slice(i, i + CH) })
const BASE = "https://www.arcodaviolin.com"
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 402, height: 900 } })
await ctx.addCookies(cookies.map((c) => ({ ...c, domain: ".arcodaviolin.com", path: "/", secure: true, sameSite: "Lax" })))
const pg = await ctx.newPage()
await pg.goto(`${BASE}/`, { waitUntil: "domcontentloaded" }); await pg.waitForTimeout(4000)
const uid = (pg.url().match(/arcodaviolin\.com\/([^/?#]+)/) || [])[1]
const PATHS = ["/practice", "/practice/etude", "/library"]
for (const path of PATHS) {
  await pg.goto(`${BASE}/${uid}${path}`, { waitUntil: "domcontentloaded" })
  await pg.waitForTimeout(4000)
  const texts = await pg.$$eval("body *", (els) => els
    .filter((e) => e.children.length === 0 && e.tagName !== "SCRIPT" && e.tagName !== "STYLE")
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
    .map((e) => (e.textContent || "").trim()).filter(Boolean))
  const parts = texts.filter((t) => /Part\d|・パート|Pary/.test(t))
  const arts = texts.filter((t) => /・(スタッカート|スピッカート|マルテレ|ポルタート|トレモロ|テヌート|スラー)/.test(t))
  const counts = texts.filter((t) => /^\d+\s*(曲|件|教材)|(曲|件|教材)\s*\d+|\d+(曲|件)/.test(t)).slice(0, 12)
  console.log(`--- ${path || "/(ホーム)"} ---`)
  console.log("  パート表記:", parts.length, JSON.stringify(parts.slice(0, 5)))
  console.log("  奏法変種表記:", arts.length, JSON.stringify(arts.slice(0, 5)))
  console.log("  件数らしき表示:", JSON.stringify(counts))
  console.log("  画面テキスト:", JSON.stringify(texts.slice(0, 60)))
}
await b.close()
