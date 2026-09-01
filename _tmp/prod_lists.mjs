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
const PATHS = []
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
  console.log("  画面テキスト:", JSON.stringify(texts.slice(0, 45)))
}
// 練習前シートの排他表示
await pg.goto(`${BASE}/${uid}/practice/etude`, { waitUntil: "domcontentloaded" })
await pg.waitForTimeout(4000)
await pg.locator('text="カイザー 練習曲 Op.20 No.1"').first().click()
await pg.waitForTimeout(2500)
const labels = async () => pg.$$eval("div", (ds) => ds.filter((d) => d.children.length === 0 && /を選ぶ/.test(d.textContent || "")).map((d) => d.textContent.trim()))
const sels = async () => pg.$$eval("select", (ss) => ss.map((s) => ({ v: s.value, o: Array.from(s.options).map((o) => o.textContent.trim()) })))
console.log("--- 練習前シート 初期 ---"); console.log(" 見出し:", await labels()); console.log(" セレクト:", JSON.stringify(await sels()))
await pg.selectOption("select >> nth=0", "staccato"); await pg.waitForTimeout(1500)
console.log("--- 奏法=スタッカート ---"); console.log(" 見出し:", await labels())
await pg.screenshot({ path: "_tmp/prod_sheet_art.png", fullPage: true })
await pg.goto(`${BASE}/${uid}/practice/etude`, { waitUntil: "domcontentloaded" }); await pg.waitForTimeout(4000)
await pg.locator('text="カイザー 練習曲 Op.20 No.1"').first().click(); await pg.waitForTimeout(2500)
const r16 = await pg.$$eval("select", (ss) => { const o = Array.from(ss[1].options).find((x) => x.textContent.trim() === "16音符"); return o ? o.value : "" })
await pg.selectOption("select >> nth=1", r16); await pg.waitForTimeout(1500)
console.log("--- パターン=16音符 ---"); console.log(" 見出し:", await labels()); console.log(" セレクト:", JSON.stringify(await sels()))
await pg.screenshot({ path: "_tmp/prod_sheet_pattern.png", fullPage: true })
await b.close()
