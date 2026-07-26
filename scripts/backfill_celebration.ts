// 祝い体験 v2.0 バックフィル (§5.4)。フラグON前に一度だけ本番で実行する。
// 目的: フラグON時に「過去分の節目」が一斉発火するのを防ぐ。
//   A. UserPracticeMastery を現存録音の真実でシード(空テーブル前提だが冪等)。
//      クリア済み教材は was_mastered=true になり、ON後の初回練習で material_clear が誤発火しない。
//      クリア済みには celebratedAt=NOW() を付け「公開前に達成済み」を刻む。
//   B. 既存 UserScoreAchievement.celebratedAt を NOW() で補填(公開前の達成=既祝い扱い)。
// 安全: 既定はドライラン(件数のみ)。実書込は BACKFILL_APPLY=1。トランザクションで一括。
//   達成/マスターの milestone は Python が「今後」だけ書くため遡及しない(このBFの対象外)。
//   masteredPerformanceId は過去分不明のため null 据置(derive が perf 不一致で再発火しない=安全)。
import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const APPLY = process.env.BACKFILL_APPLY === "1"
const MASTER_RECENT_COUNT = 5
const MASTER_AVG = 90

// UserPracticeMastery を現存録音からゼロ導出して upsert (recompute_practice_mastery の一斉版)。
const SEED_MASTERY_SQL = `
WITH ranked AS (
  SELECT "userId", "practiceItemId",
    (("pitchAccuracy" + "timingAccuracy") / 2.0) AS avg2,
    ROW_NUMBER() OVER (PARTITION BY "userId", "practiceItemId" ORDER BY "uploadedAt" DESC) AS rn
  FROM "PracticePerformance"
  WHERE "pitchAccuracy" IS NOT NULL AND "timingAccuracy" IS NOT NULL
),
agg AS (
  SELECT "userId", "practiceItemId",
    COUNT(*) AS total_count,
    AVG(avg2) FILTER (WHERE rn <= ${MASTER_RECENT_COUNT}) AS recent_avg,
    COUNT(*) FILTER (WHERE rn <= ${MASTER_RECENT_COUNT}) AS recent_cnt
  FROM ranked
  GROUP BY "userId", "practiceItemId"
),
calc AS (
  SELECT "userId", "practiceItemId", recent_avg, total_count,
    (recent_cnt >= ${MASTER_RECENT_COUNT} AND recent_avg IS NOT NULL AND recent_avg >= ${MASTER_AVG}) AS is_mastered
  FROM agg
)
INSERT INTO "UserPracticeMastery"
  (id, "userId", "practiceItemId", "recentAverageScore", "totalPerformanceCount",
   "isPerformanceMastered", "masteredAt", "celebratedAt", "updatedAt")
SELECT
  gen_random_uuid()::text, "userId", "practiceItemId", recent_avg, total_count,
  is_mastered,
  CASE WHEN is_mastered THEN NOW() ELSE NULL END,
  CASE WHEN is_mastered THEN NOW() ELSE NULL END,
  NOW()
FROM calc
ON CONFLICT ("userId", "practiceItemId") DO UPDATE SET
  "recentAverageScore" = EXCLUDED."recentAverageScore",
  "totalPerformanceCount" = EXCLUDED."totalPerformanceCount",
  "isPerformanceMastered" = EXCLUDED."isPerformanceMastered",
  "masteredAt" = CASE WHEN EXCLUDED."isPerformanceMastered"
                   THEN COALESCE("UserPracticeMastery"."masteredAt", NOW()) ELSE NULL END,
  "celebratedAt" = CASE WHEN EXCLUDED."isPerformanceMastered"
                     THEN COALESCE("UserPracticeMastery"."celebratedAt", NOW()) ELSE "UserPracticeMastery"."celebratedAt" END,
  "updatedAt" = NOW()
`

async function main() {
  console.log(`=== 祝いBF (${APPLY ? "APPLY=本番書込" : "DRY-RUN=件数のみ"}) ===`)

  // --- 事前カウント (ドライラン共通) ---
  const pairRows = await prisma.$queryRawUnsafe<{ pairs: bigint; cleared: bigint }[]>(`
    WITH ranked AS (
      SELECT "userId", "practiceItemId",
        (("pitchAccuracy" + "timingAccuracy") / 2.0) AS avg2,
        ROW_NUMBER() OVER (PARTITION BY "userId", "practiceItemId" ORDER BY "uploadedAt" DESC) AS rn
      FROM "PracticePerformance"
      WHERE "pitchAccuracy" IS NOT NULL AND "timingAccuracy" IS NOT NULL
    ),
    agg AS (
      SELECT "userId", "practiceItemId",
        AVG(avg2) FILTER (WHERE rn <= ${MASTER_RECENT_COUNT}) AS recent_avg,
        COUNT(*) FILTER (WHERE rn <= ${MASTER_RECENT_COUNT}) AS recent_cnt
      FROM ranked GROUP BY "userId", "practiceItemId"
    )
    SELECT COUNT(*) AS pairs,
      COUNT(*) FILTER (WHERE recent_cnt >= ${MASTER_RECENT_COUNT} AND recent_avg >= ${MASTER_AVG}) AS cleared
    FROM agg
  `)
  const existingMastery = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*) AS n FROM "UserPracticeMastery"`,
  )
  const achNull = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*) AS n FROM "UserScoreAchievement" WHERE "celebratedAt" IS NULL`,
  )
  console.log(`A. 対象 (user×教材, 評価済み録音あり): ${pairRows[0].pairs} 組`)
  console.log(`   うちクリア済み(直近5・平均90) : ${pairRows[0].cleared} 組 → celebratedAt付与`)
  console.log(`   既存 UserPracticeMastery 行数  : ${existingMastery[0].n} (0=想定通り空)`)
  console.log(`B. UserScoreAchievement celebratedAt=null: ${achNull[0].n} 行 → NOW()補填`)

  if (!APPLY) {
    console.log("\nドライラン終了。実行するには BACKFILL_APPLY=1 を付けて再実行。")
    return
  }

  // --- 本番書込 (トランザクション) ---
  await prisma.$transaction(async (tx) => {
    const seeded = await tx.$executeRawUnsafe(SEED_MASTERY_SQL)
    const filled = await tx.$executeRawUnsafe(
      `UPDATE "UserScoreAchievement" SET "celebratedAt" = NOW() WHERE "celebratedAt" IS NULL`,
    )
    console.log(`\nA. UserPracticeMastery upsert : ${seeded} 行`)
    console.log(`B. UserScoreAchievement 補填  : ${filled} 行`)
  })
  console.log("=== 完了 ===")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
