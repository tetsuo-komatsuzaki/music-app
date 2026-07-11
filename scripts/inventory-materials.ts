/**
 * 教材在庫チェック（読み取り専用）。
 * PracticeItem / Score の在庫をカテゴリ×★×調 等で集計し、
 * カバレッジ行列の素データを出力する。
 *
 * 実行: npx tsx scripts/inventory-materials.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

function q<T = any>(sql: string) {
  return prisma.$queryRawUnsafe<T[]>(sql)
}

async function main() {
  // 1. カテゴリ別 総数 / 公開数 / ★あり数 / 調あり数 / fingering(positions)あり数
  const byCat = await q(`
    select
      category::text as category,
      count(*)::int as total,
      count(*) filter (where "isPublished")::int as published,
      count(*) filter (where star is not null)::int as has_star,
      count(*) filter (where "keyTonic" is not null and "keyTonic" <> '')::int as has_key,
      count(*) filter (where array_length(positions,1) is not null)::int as has_positions,
      count(*) filter (where "tempoMin" is not null)::int as has_tempo
    from "PracticeItem"
    group by category
    order by category
  `)
  console.log("=== [A] PracticeItem カテゴリ別サマリ ===")
  console.log("category | total | published | ★有 | 調有 | pos有 | tempo有")
  for (const r of byCat) {
    console.log(`${r.category} | ${r.total} | ${r.published} | ${r.has_star} | ${r.has_key} | ${r.has_positions} | ${r.has_tempo}`)
  }

  // 2. カテゴリ × ★ クロス集計
  const catStar = await q(`
    select category::text as category, coalesce(star, -1) as star, count(*)::int as c
    from "PracticeItem"
    group by category, star
    order by category, star
  `)
  console.log("\n=== [B] カテゴリ × ★ クロス (star=-1 は未設定) ===")
  for (const r of catStar) {
    console.log(`${r.category} | ★${r.star} | ${r.c}`)
  }

  // 3. カテゴリ × 調(keyTonic/keyMode) クロス
  const catKey = await q(`
    select category::text as category,
      coalesce(nullif("keyTonic",''),'(null)') as tonic,
      coalesce(nullif("keyMode",''),'(null)') as mode,
      count(*)::int as c
    from "PracticeItem"
    group by category, "keyTonic", "keyMode"
    order by category, tonic, mode
  `)
  console.log("\n=== [C] カテゴリ × 調 クロス ===")
  for (const r of catKey) {
    console.log(`${r.category} | ${r.tonic} ${r.mode} | ${r.c}`)
  }

  // 4. 技法(TechniqueTag) × 教材数（PracticeItemTechnique 経由）
  const techCat = await q(`
    select t.name as technique,
      count(distinct pit."practiceItemId")::int as item_count,
      string_agg(distinct pi.category::text, ',') as categories
    from "TechniqueTag" t
    left join "PracticeItemTechnique" pit on pit."techniqueTagId" = t.id
    left join "PracticeItem" pi on pi.id = pit."practiceItemId"
    group by t.name
    order by item_count desc, technique
  `)
  console.log("\n=== [D] 技法タグ × 教材数 ===")
  for (const r of techCat) {
    console.log(`${r.technique} | ${r.item_count}件 | ${r.categories ?? "(教材なし)"}`)
  }

  // 5. Score(曲) の在庫
  const scores = await q(`
    select
      count(*)::int as total,
      count(*) filter (where "isShared")::int as shared,
      count(*) filter (where star is not null)::int as has_star,
      count(*) filter (where "keyTonic" is not null and "keyTonic" <> '')::int as has_key,
      count(*) filter (where "ownerScope"='admin')::int as admin_scope
    from "Score"
    where "deletedAt" is null
  `)
  console.log("\n=== [E] Score(曲) 在庫サマリ ===")
  const s = scores[0]
  console.log(`total=${s.total} shared=${s.shared} ★有=${s.has_star} 調有=${s.has_key} admin=${s.admin_scope}`)

  // 6. Score × ★
  const scoreStar = await q(`
    select coalesce(star,-1) as star, count(*)::int as c
    from "Score" where "deletedAt" is null
    group by star order by star
  `)
  console.log("\n=== [F] Score × ★ ===")
  for (const r of scoreStar) console.log(`★${r.star} | ${r.c}`)

  // 7. MissingPracticeItemFlag（教材の穴・既知の欠落）
  const missing = await q(`
    select "missingCategory" as cat, "keyTonic" as tonic, "keyMode" as mode, star,
      count(*)::int as c, count(*) filter (where "resolvedAt" is null)::int as unresolved
    from "MissingPracticeItemFlag"
    group by "missingCategory", "keyTonic", "keyMode", star
    order by unresolved desc, c desc
    limit 50
  `)
  console.log("\n=== [G] MissingPracticeItemFlag（システムが検出した教材の穴） ===")
  if (missing.length === 0) console.log("(記録なし)")
  for (const r of missing) {
    console.log(`${r.cat} | ${r.tonic} ${r.mode} ★${r.star} | 計${r.c}(未解決${r.unresolved})`)
  }
}

main()
  .catch((e) => console.error("ERROR:", e?.message ?? e))
  .finally(() => prisma.$disconnect())
