import { config } from "dotenv"
config()
import { createClient } from "@supabase/supabase-js"
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const { data, error } = await supa.storage.from("musicxml").download("practice/cmtd8q511000304l3d34g7tam/analysis.json")
  if (error) { console.log("ERR", error.message); return }
  const j = JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"))
  const notes = j.notes ?? j.score_notes ?? []
  const ms = notes.map((n: { measure_number?: number }) => n.measure_number).filter((m: number | undefined) => m != null)
  console.log("notes:", notes.length, "measures:", Math.min(...ms), "..", Math.max(...ms), "distinct:", new Set(ms).size)
}
main()
