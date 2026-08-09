import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
async function main() {
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Check original XML
  const { data: orig, error: e1 } = await supa.storage.from("musicxml").download("a0952076-2a93-4270-876d-0d8ece45a647/cmplsdfv8000004jsd50oxz4h.musicxml")
  if (orig) {
    const xml = await orig.text()
    const measures = (xml.match(/<measure\s+number=/g) ?? []).length
    const distinctMeasures = new Set([...xml.matchAll(/<measure\s+number="([^"]+)"/g)].map(m => m[1]))
    console.log(`Original XML measure tags: ${measures}, distinct numbers: ${distinctMeasures.size}`)
    // Check for repeats
    const repeatStart = (xml.match(/<repeat\s+direction="forward"/g) ?? []).length
    const repeatEnd = (xml.match(/<repeat\s+direction="backward"/g) ?? []).length
    console.log(`Repeats: forward=${repeatStart}, backward=${repeatEnd}`)
    console.log(`XML size: ${xml.length} bytes`)
    // Sample first 1000 chars
    console.log(`\n--- first 500 chars ---\n${xml.slice(0, 500)}`)
  } else {
    console.log("orig err:", e1)
  }

  // Also check build_score.musicxml (post-processed) more carefully
  const { data: build } = await supa.storage.from("musicxml").download("cmmm46xn40000jgjytot9eobc/cmplsdfv8000004jsd50oxz4h/build_score.musicxml")
  if (build) {
    const xml = await build.text()
    console.log(`\n--- build_score.musicxml size: ${xml.length} bytes ---`)
    console.log(`First 500 chars: ${xml.slice(0, 500)}`)
    // Check if it's a .mxl (compressed)
    if (xml.startsWith("PK")) {
      console.log("(compressed .mxl format)")
    }
  }
}
main()
