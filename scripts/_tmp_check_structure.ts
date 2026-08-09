import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const id = process.env.PI_ID!
  const { data, error } = await sb.storage.from("musicxml").download(`practice/${id}/analysis.json`)
  if (error) throw error
  const j = JSON.parse(await data.text())
  console.log("directions:", JSON.stringify(j.directions ?? "(なし)").slice(0, 240))
  console.log("structure :", JSON.stringify(j.structure ?? "(なし)", null, 1))
}
main().catch(e => { console.error(e); process.exitCode = 1 })
