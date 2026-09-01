// 本番の練習前画面を実際に開いてパターン欄を読む (セッションcookieを直接注入)
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(SB_URL).hostname.split(".")[0]
const sb = createClient(SB_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb.auth.admin.generateLink({ type: "magiclink", email: "tetsuo9293@gmail.com" })
if (error) { console.error("link失敗", error.message); process.exit(1) }

// verify エンドポイントを叩いて implicit フローのトークンを取り出す
const verify = new URL(data.properties.action_link)
verify.searchParams.set("redirect_to", "http://localhost/ok")
const res = await fetch(verify.toString(), { redirect: "manual" })
const loc = res.headers.get("location") || ""
const hash = new URLSearchParams(loc.split("#")[1] || "")
const access_token = hash.get("access_token"), refresh_token = hash.get("refresh_token")
if (!access_token) { console.error("token取得失敗", loc.slice(0, 200)); process.exit(1) }
const { data: u } = await sb.auth.getUser(access_token)
const session = {
  access_token, refresh_token, token_type: "bearer",
  expires_in: Number(hash.get("expires_in") || 3600), expires_at: Number(hash.get("expires_at")),
  user: u.user,
}
const val = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64")
const name = `sb-${ref}-auth-token`
const CH = 3180
const cookies = []
if (val.length <= CH) cookies.push({ name, value: val })
else for (let i = 0, n = 0; i < val.length; i += CH, n++) cookies.push({ name: `${name}.${n}`, value: val.slice(i, i + CH) })

const BASE = "https://www.arcodaviolin.com"
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 402, height: 900 } })
await ctx.addCookies(cookies.map((c) => ({ ...c, domain: ".arcodaviolin.com", path: "/", httpOnly: false, secure: true, sameSite: "Lax" })))
const pg = await ctx.newPage()
pg.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 120)))
await pg.goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
await pg.waitForTimeout(5000)
console.log("ホーム:", pg.url())
const uid = (pg.url().match(/arcodaviolin\.com\/([^/?#]+)/) || [])[1]
console.log("userId:", uid)
await pg.goto(`${BASE}/${uid}/practice/etude`, { waitUntil: "domcontentloaded" })
await pg.waitForTimeout(5000)
console.log("一覧:", pg.url())

async function openSheet(label) {
  await pg.goto(`${BASE}/${uid}/practice/etude`, { waitUntil: "domcontentloaded" })
  await pg.waitForTimeout(3500)
  const t = pg.locator(`text="${label}"`).first()
  if (!(await t.count())) { console.log(`${label}: カード無し`); return null }
  await t.click(); await pg.waitForTimeout(2500)
  return true
}
const read = async () => pg.$$eval("select", (ss) => ss.map((s) => ({ v: s.value, o: Array.from(s.options).map((o) => o.textContent.trim()) })))

await openSheet("カイザー 練習曲 Op.20 No.1")
let s1 = await read()
console.log("No.1 奏法:", JSON.stringify(s1[0].o))
console.log("No.1 パターン:", JSON.stringify(s1[1].o))
console.log("No.1 パート(既定):", JSON.stringify(s1[2].o))
await pg.selectOption("select", { value: "slur" }); await pg.waitForTimeout(1800)
let s2 = await read()
console.log("No.1 奏法=スラー のパート:", JSON.stringify(s2.at(-1).o))
await pg.screenshot({ path: "_tmp/prod_no1_slur.png", fullPage: true })

await openSheet("カイザー 練習曲 Op.20 No.2")
let s3 = await read()
console.log("No.2 奏法:", JSON.stringify(s3[0].o))
console.log("No.2 セレクト数:", s3.length)
await pg.screenshot({ path: "_tmp/prod_no2.png", fullPage: true })
await b.close()
