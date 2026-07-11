/** 工程F 適用検証（読み取りのみ） */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  // 1. 新カラムの存在（information_schema）
  const cols = await prisma.$queryRawUnsafe<any[]>(`
    select table_name, column_name, data_type
    from information_schema.columns
    where (table_name='Score' and column_name in ('pitchMin','pitchMax','positions'))
       or (table_name='PracticeItem' and column_name in ('pitchMin','pitchMax'))
    order by table_name, column_name
  `)
  console.log("=== 新カラム ===")
  for (const c of cols) console.log(`  ${c.table_name}.${c.column_name} : ${c.data_type}`)

  // 2. 新テーブルの存在
  const tables = await prisma.$queryRawUnsafe<any[]>(`
    select table_name from information_schema.tables
    where table_name in ('ScoreKey','FeatureTag','ScoreFeatureTag','PracticeItemFeatureTag')
    order by table_name
  `)
  console.log("=== 新テーブル ===")
  for (const t of tables) console.log(`  ${t.table_name}`)

  // 3. シードと習得系フラグ
  const acq = await prisma.featureTag.findMany({
    where: { isAcquisition: true },
    select: { category: true, name: true },
    orderBy: { name: "asc" },
  })
  console.log(`=== 習得系(isAcquisition=true) ${acq.length}件 ===`)
  for (const a of acq) console.log(`  ${a.category}/${a.name}`)

  // 4. 既存データ無傷の確認（件数不変）
  const counts = await prisma.$queryRawUnsafe<any[]>(`
    select 'Score' as t, count(*)::int c from "Score" where "deletedAt" is null
    union all select 'PracticeItem', count(*)::int from "PracticeItem"
    union all select 'Performance', count(*)::int from "Performance"
  `)
  console.log("=== 既存データ件数（無傷確認） ===")
  for (const c of counts) console.log(`  ${c.t}: ${c.c}`)
}
main().catch((e) => console.error("ERR:", e?.message ?? e)).finally(() => prisma.$disconnect())
