import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
async function main() {
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: list } = await supa.storage.from("musicxml").list("cmmm46xn40000jgjytot9eobc/cmplsdfv8000004jsd50oxz4h")
  console.log("Files:")
  for (const f of list ?? []) console.log(" ", f.name)

  // Try downloading the analysis (likely named based on actual structure)
  const { data: build_xml } = await supa.storage.from("musicxml").download("cmmm46xn40000jgjytot9eobc/cmplsdfv8000004jsd50oxz4h/build_score.musicxml")
  if (build_xml) {
    const xml = await build_xml.text()
    // Count <measure> tags
    const measureCount = (xml.match(/<measure\s+number=/g) ?? []).length
    console.log(`\nmeasure tags in XML: ${measureCount}`)
    // Also count distinct measure numbers (could be repeated for multi-part)
    const numbers = new Set<string>()
    for (const m of xml.matchAll(/<measure\s+number="([^"]+)"/g)) {
      numbers.add(m[1])
    }
    console.log(`distinct measure numbers: ${numbers.size} (range: ${[...numbers].slice(0,3)}...${[...numbers].slice(-3)})`)
  } else {
    console.log("Could not download build_score.musicxml")
  }
}
main()
