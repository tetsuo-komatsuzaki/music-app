// 基礎練録音の痕跡調査 (読み取りのみ): storage の practice/ 配下に音声があるか
import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // practice/ 直下 (ユーザーごとのフォルダ)
  const { data: top, error } = await sb.storage.from("performances").list("practice", { limit: 50 })
  if (error) { console.log("list error:", error.message); return }
  console.log(`practice/ 直下: ${top?.length ?? 0}件`)
  for (const e of top ?? []) console.log(" -", e.name, e.id ? "(file)" : "(folder)")

  // フォルダがあれば1階層潜る
  for (const e of (top ?? []).slice(0, 3)) {
    if (e.id) continue
    const { data: sub } = await sb.storage.from("performances").list(`practice/${e.name}`, { limit: 20 })
    console.log(`practice/${e.name}/: ${sub?.length ?? 0}件`)
    for (const s of (sub ?? []).slice(0, 5)) console.log("   -", s.name)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
