import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
async function main() {
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: orig } = await supa.storage.from("musicxml").download("a0952076-2a93-4270-876d-0d8ece45a647/cmplsdfv8000004jsd50oxz4h.musicxml")
  const xml = await orig!.text()
  const measures = (xml.match(/<measure\b[^>]*number\s*=/g) ?? []).length
  const distinctMeasures = new Set([...xml.matchAll(/<measure\b[^>]*number="([^"]+)"/g)].map(m => m[1]))
  console.log(`Original XML <measure number=...> tags: ${measures}, distinct numbers: ${distinctMeasures.size}`)
  if (distinctMeasures.size > 0) {
    const sorted = [...distinctMeasures].sort((a, b) => Number(a) - Number(b))
    console.log(`Range: ${sorted[0]} - ${sorted[sorted.length-1]}`)
  }
  // Repeats
  const r1 = (xml.match(/<repeat\s+direction="forward"/g) ?? []).length
  const r2 = (xml.match(/<repeat\s+direction="backward"/g) ?? []).length
  console.log(`Repeats: forward=${r1}, backward=${r2}`)

  // Build XML
  const { data: build } = await supa.storage.from("musicxml").download("cmmm46xn40000jgjytot9eobc/cmplsdfv8000004jsd50oxz4h/build_score.musicxml")
  const bxml = await build!.text()
  const bmeasures = (bxml.match(/<measure\b[^>]*number\s*=/g) ?? []).length
  const bdistinct = new Set([...bxml.matchAll(/<measure\b[^>]*number="([^"]+)"/g)].map(m => m[1]))
  console.log(`\nBuild XML <measure number=...> tags: ${bmeasures}, distinct: ${bdistinct.size}`)
  if (bdistinct.size > 0) {
    const sorted = [...bdistinct].sort((a, b) => Number(a) - Number(b))
    console.log(`Range: ${sorted[0]} - ${sorted[sorted.length-1]}`)
  }
}
main()
