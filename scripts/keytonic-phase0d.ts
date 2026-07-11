import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // keyTonic が入っている成功例 1件と null の1件、両方の置き場所を比較
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    (select s.id, s.title, s."originalXmlPath", s."createdById", s."keyTonic"
     from "Score" s where s."deletedAt" is null and s."keyTonic" is not null and s."keyTonic"<>''
     order by s."createdAt" desc limit 1)
    union all
    (select s.id, s.title, s."originalXmlPath", s."createdById", s."keyTonic"
     from "Score" s where s."deletedAt" is null and (s."keyTonic" is null or s."keyTonic"='')
     order by s."createdAt" asc limit 1)
  `)
  for (const s of rows) {
    const authRoot = String(s.originalXmlPath).split("/")[0]
    console.log(`\n### ${s.title} (keyTonic=${s.keyTonic ?? "null"}) score=${s.id}`)
    for (const root of [authRoot, s.createdById]) {
      const { data } = await supa.storage.from("musicxml").list(`${root}/${s.id}`, { limit: 10 })
      console.log(` ${root}/${s.id}/ -> ${data && data.length ? data.map((f) => f.name).join(", ") : "(なし)"}`)
    }
  }
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
