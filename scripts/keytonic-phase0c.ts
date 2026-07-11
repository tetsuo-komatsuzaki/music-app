import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const AUTH = "a0952076-2a93-4270-876d-0d8ece45a647"
const IDS = [
  "cmq2kzp13000b04kyfm5isge4", // 赤とんぼ done
  "cmquvg2so000005jviyj9y7xg", // メヌエット error
]

async function main() {
  // ユーザーフォルダ直下
  const { data: rootList } = await supa.storage.from("musicxml").list(AUTH, { limit: 10 })
  console.log(`=== ${AUTH} 直下 (先頭10) ===`)
  for (const f of rootList ?? []) console.log(` ${f.name}${f.id ? "" : "/"}`)

  for (const id of IDS) {
    const { data: sub } = await supa.storage.from("musicxml").list(`${AUTH}/${id}`, { limit: 20 })
    console.log(`\n=== ${AUTH}/${id}/ ===`)
    if (!sub || sub.length === 0) { console.log(" (フォルダなし/空)"); continue }
    for (const f of sub) console.log(` ${f.name}`)
  }
}
main().catch((e) => console.error("ERR", e?.message ?? e))
