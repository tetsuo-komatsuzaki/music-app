import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
async function main() {
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: ana } = await supa.storage.from("musicxml").download("cmmm46xn40000jgjytot9eobc/cmplsdfv8000004jsd50oxz4h/analysis.json")
  if (ana) {
    const json = JSON.parse(await ana.text())
    console.log("Keys:", Object.keys(json).join(", "))
    console.log("BPM:", json.bpm)
    console.log("time_signature:", JSON.stringify(json.time_signature))
    if (Array.isArray(json.notes)) {
      console.log("notes.length:", json.notes.length)
      const ms = new Set(json.notes.map((n: any) => n.measure_number).filter((x: any) => x != null))
      const sorted = [...ms].sort((a: any, b: any) => Number(a) - Number(b))
      console.log(`measures: ${ms.size}, range: ${sorted[0]} - ${sorted[sorted.length-1]}`)
    }
    if (json.total_measures != null) console.log("total_measures:", json.total_measures)
  }
}
main()
