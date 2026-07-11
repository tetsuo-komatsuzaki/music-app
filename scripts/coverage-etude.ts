import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    select
      pi.id, pi.title, pi.composer,
      coalesce(nullif(pi."keyTonic",''),'-') as tonic,
      coalesce(nullif(pi."keyMode",''),'-') as mode,
      coalesce(pi.star,-1) as star,
      array_length(pi.positions,1) as npos,
      (select string_agg(t.name, ',') from "PracticeItemTechnique" pit
        join "TechniqueTag" t on t.id = pit."techniqueTagId"
        where pit."practiceItemId" = pi.id) as techniques
    from "PracticeItem" pi
    where pi.category = 'etude'
    order by star, tonic
  `)
  console.log(`エチュード ${rows.length}件`)
  console.log("title | 調 | ★ | pos数 | 技術タグ")
  for (const r of rows) {
    console.log(`${r.title} | ${r.tonic} ${r.mode} | ★${r.star} | ${r.npos ?? 0} | ${r.techniques ?? "(なし)"}`)
  }
  // 技術タグ被覆サマリ
  const techCov = await prisma.$queryRawUnsafe<any[]>(`
    select t.name, count(distinct pit."practiceItemId")::int as c
    from "TechniqueTag" t
    left join "PracticeItemTechnique" pit on pit."techniqueTagId" = t.id
    left join "PracticeItem" pi on pi.id = pit."practiceItemId" and pi.category='etude'
    group by t.name order by c desc, t.name
  `)
  console.log("\n-- エチュードが持つ技術タグ被覆 --")
  for (const r of techCov) console.log(`  ${r.name}: ${r.c}件`)
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
