import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const e = await prisma.$queryRawUnsafe<any[]>(
    `select id, title, "originalXmlPath" from "PracticeItem" where category='etude' order by id limit 2`
  )
  for (const it of e) {
    const { data, error } = await supa.storage.from("musicxml").download(it.originalXmlPath)
    if (error || !data) { console.log("DL error", it.title, error?.message); continue }
    const buf = Buffer.from(await data.arrayBuffer())
    const t = buf.toString("utf8")
    console.log(`\n[${it.title}] path=${it.originalXmlPath}`)
    console.log(`  bytes=${buf.length} zipPK=${buf[0] === 0x50 && buf[1] === 0x4b}`)
    console.log(`  <note count=${(t.match(/<note\b/g) || []).length}  score-partwise=${t.includes("score-partwise")}  score-timewise=${t.includes("score-timewise")}`)
    console.log(`  head=${JSON.stringify(t.slice(0, 120))}`)
  }
}
main().catch((e) => console.log("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
