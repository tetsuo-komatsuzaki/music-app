import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const score = await prisma.score.findUnique({
    where: { id: "cmplsdfv8000004jsd50oxz4h" },
    select: { id: true, title: true, originalXmlPath: true, generatedXmlPath: true },
  })
  console.log("Score:", JSON.stringify(score, null, 2))
  if (!score) return

  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const path = score.generatedXmlPath ?? score.originalXmlPath
  let p = path
  if (p.startsWith("musicxml/")) p = p.slice("musicxml/".length)
  const { data, error } = await supa.storage.from("musicxml").download(p)
  if (error) { console.error("err:", error); return }
  const text = await data.text()
  fs.writeFileSync("./aria.musicxml", text)
  console.log(`Saved to ./aria.musicxml (${text.length} chars)`)

  // Count measures in MusicXML
  const measureCount = (text.match(/<measure\s/g) ?? []).length
  console.log(`<measure> tag count: ${measureCount}`)

  // Check for explicit page-break or new-page elements
  const pageBreaks = (text.match(/new-page="yes"/g) ?? []).length
  const systemBreaks = (text.match(/new-system="yes"/g) ?? []).length
  console.log(`new-page="yes" count: ${pageBreaks}`)
  console.log(`new-system="yes" count: ${systemBreaks}`)
}
main().finally(() => prisma.$disconnect())
