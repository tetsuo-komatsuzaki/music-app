import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await supa.storage.from("musicxml").list("practice/cmtd8q511000304l3d34g7tam")
  if (error) { console.log("ERR", error.message); return }
  for (const f of data) console.log(f.name, f.updated_at, f.metadata?.size)
}
main()
