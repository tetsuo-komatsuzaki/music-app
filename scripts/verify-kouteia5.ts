/** 工程A-5 apply後のDB検証（読み取りのみ） */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const q = (sql: string) => prisma.$queryRawUnsafe<any[]>(sql)

  // 1. 数値カラム充足率
  const nums = await q(`
    select 'Score' as t, count(*)::int total,
      count("pitchMin")::int has_pitch,
      count(*) filter (where array_length(positions,1) is not null)::int has_pos
    from "Score" where "deletedAt" is null
    union all
    select 'PracticeItem', count(*)::int, count("pitchMin")::int, null
    from "PracticeItem"
  `)
  console.log("=== 数値カラム充足 ===")
  for (const r of nums) console.log(`  ${r.t}: total=${r.total} pitchMin有=${r.has_pitch} positions有=${r.has_pos ?? "-"}`)

  // 2. タグ付与の分布
  const tags = await q(`
    select 'ScoreFeatureTag' as t, count(*)::int c, count(distinct "scoreId")::int items from "ScoreFeatureTag"
    union all select 'PracticeItemFeatureTag', count(*)::int, count(distinct "practiceItemId")::int from "PracticeItemFeatureTag"
    union all select 'ScoreTechniqueTag', count(*)::int, count(distinct "scoreId")::int from "ScoreTechniqueTag"
    union all select 'PracticeItemTechnique', count(*)::int, count(distinct "practiceItemId")::int from "PracticeItemTechnique"
    union all select 'ScoreKey(副次調)', count(*)::int, count(distinct "scoreId")::int from "ScoreKey"
  `)
  console.log("=== タグ/副次調 付与 ===")
  for (const r of tags) console.log(`  ${r.t}: ${r.c}行 / ${r.items}件`)

  // 3. 手動タグの無傷確認（apply前に存在した手動付与: スタッカート15/ピチカート2/トリル1/トレモロ1/ビブラート1/ポルタート1 が消えていないか）
  const manual = await q(`
    select t.name, count(*)::int c from "PracticeItemTechnique" pit
    join "TechniqueTag" t on t.id = pit."techniqueTagId"
    group by t.name order by c desc
  `)
  console.log("=== PracticeItemTechnique 分布 (手動分は増えこそすれ減らない) ===")
  for (const r of manual) console.log(`  ${r.name}: ${r.c}`)

  // 4. FeatureTag 別の付与トップ
  const ft = await q(`
    select f.category, f.name, count(*)::int c
    from "ScoreFeatureTag" sft join "FeatureTag" f on f.id = sft."featureTagId"
    group by f.category, f.name order by c desc limit 8
  `)
  console.log("=== Score 特徴タグ トップ8 ===")
  for (const r of ft) console.log(`  ${r.category}/${r.name}: ${r.c}曲`)
}
main().catch((e) => console.error("ERR:", e?.message ?? e)).finally(() => prisma.$disconnect())
