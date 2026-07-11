import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "fs"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const e = await prisma.$queryRawUnsafe<any[]>(
    `select id, title, "originalXmlPath" from "PracticeItem" where category='scale' and "keyTonic"='C' order by star limit 1`
  )
  if (!e.length) { console.log("no C scale found"); return }
  const it = e[0]
  const { data, error } = await supa.storage.from("musicxml").download(it.originalXmlPath)
  if (error || !data) { console.log("DL error", error?.message); return }
  const buf = Buffer.from(await data.arrayBuffer())
  const out = "scripts/base_scale.musicxml"
  writeFileSync(out, buf)
  const t = buf.toString("utf8")
  console.log(`title: ${it.title}`)
  console.log(`saved: ${out}  bytes=${buf.length}  zip=${buf[0] === 0x50 && buf[1] === 0x4b}`)
  console.log(`<note count=${(t.match(/<note\b/g) || []).length}  score-partwise=${t.includes("score-partwise")}`)
  // 最初の音符ブロックの雰囲気
  const idx = t.indexOf("<note")
  console.log("first note snippet:\n" + t.slice(idx, idx + 400))
}
main().catch((e) => console.log("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
