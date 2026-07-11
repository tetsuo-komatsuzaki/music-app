import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  // 1. Score の keyTonic 充足状況 × analysisStatus
  const scores = await prisma.$queryRawUnsafe<any[]>(`
    select
      "analysisStatus"::text as status,
      count(*)::int as total,
      count(*) filter (where "keyTonic" is null or "keyTonic"='')::int as null_key
    from "Score" where "deletedAt" is null
    group by "analysisStatus" order by status
  `)
  console.log("=== [1] Score: analysisStatus × keyTonic null ===")
  for (const r of scores) console.log(`${r.status} | total=${r.total} | keyTonic null=${r.null_key}`)

  // 2. null レコードの詳細（解析done なのに null = 書き込み漏れの証拠）
  const nulls = await prisma.$queryRawUnsafe<any[]>(`
    select id, title, "analysisStatus"::text as status, "createdAt"
    from "Score"
    where "deletedAt" is null and ("keyTonic" is null or "keyTonic"='')
    order by "createdAt" asc
  `)
  console.log(`\n=== [2] keyTonic null の Score（${nulls.length}件） ===`)
  for (const r of nulls) console.log(`${r.title} | ${r.status} | ${new Date(r.createdAt).toISOString().slice(0, 10)} | id=${r.id.slice(0, 8)}`)

  // 3. tonic 表記の分布（enharmonic 確認: C#/Db, Bb/A# など）
  const tonics = await prisma.$queryRawUnsafe<any[]>(`
    select 'Score' as src, "keyTonic" as tonic, "keyMode" as mode, count(*)::int as c
    from "Score" where "deletedAt" is null and "keyTonic" is not null and "keyTonic"<>''
    group by "keyTonic","keyMode"
    union all
    select 'PracticeItem', "keyTonic", "keyMode", count(*)::int
    from "PracticeItem" where "keyTonic" is not null and "keyTonic"<>''
    group by "keyTonic","keyMode"
    order by src, tonic
  `)
  console.log("\n=== [3] tonic 表記の分布（Score vs PracticeItem・enharmonic確認） ===")
  for (const r of tonics) console.log(`${r.src} | ${r.tonic} ${r.mode} | ${r.c}`)
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
