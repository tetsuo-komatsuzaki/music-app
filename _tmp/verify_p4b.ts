import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data } = await supa.storage.from("musicxml").download("practice/cmtd8q511000304l3d34g7tam/build_score.musicxml")
  const txt = Buffer.from(await data!.arrayBuffer()).toString("utf8")
  const nums = [...txt.matchAll(/<measure[^>]*number="([^"]+)"/g)].map(m => m[1])
  const notes = (txt.match(/<note>/g) ?? []).length
  const ts = txt.match(/<beats>(\d+)<\/beats>\s*<beat-type>(\d+)/)
  console.log("measures:", nums.length, nums.join(","))
  console.log("notes:", notes, "timesig:", ts?.[1] + "/" + ts?.[2])
}
main()
