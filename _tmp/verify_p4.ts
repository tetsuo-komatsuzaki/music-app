import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await supa.storage.from("musicxml").download("practice/cmtd8q511000304l3d34g7tam/build_score.musicxml")
  if (error) { console.log("ERR", error.message); return }
  const txt = Buffer.from(await data.arrayBuffer()).toString("utf8")
  const nums = [...txt.matchAll(/<measure[^>]*number="([^"]+)"/g)].map(m => m[1])
  console.log("measures:", nums.length, "first:", nums[0], "last:", nums[nums.length - 1])
}
main()
