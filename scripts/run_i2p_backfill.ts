// scripts/run_i2p_backfill.ts
//
// scripts/i2p_backfill.sql を Prisma 経由で実行するラッパー。
// psql が PATH にない Windows 環境用。
//
// 実行: npx tsx scripts/run_i2p_backfill.ts
//
// SQL 全文は scripts/i2p_backfill.sql を参照。本ラッパーは:
//   1. SQL ファイル読み込み + コメント除去
//   2. $executeRawUnsafe で 6 つの UPDATE を順次実行 (BEGIN/COMMIT 自動)
//   3. 件数検証 SELECT を実行して結果出力

import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Prisma 7 + PrismaPg adapter (DIRECT_URL を使用、migrations と同じ direct connection)
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("=== I2 = P Backfill (v1.5) 実行開始 ===\n")

  // 実行前件数
  const beforePerf = await prisma.$queryRawUnsafe<Array<{
    rhythm: bigint; bowing: bigint; overall: bigint
  }>>(`
    SELECT
      COUNT(*) FILTER (WHERE "rhythmAccuracy" IS NOT NULL) AS rhythm,
      COUNT(*) FILTER (WHERE "bowingAccuracy" IS NOT NULL) AS bowing,
      COUNT(*) FILTER (WHERE "overallScore" IS NOT NULL) AS overall
    FROM "Performance"
  `)
  const beforePractice = await prisma.$queryRawUnsafe<Array<{
    rhythm: bigint; bowing: bigint; overall: bigint
  }>>(`
    SELECT
      COUNT(*) FILTER (WHERE "rhythmAccuracy" IS NOT NULL) AS rhythm,
      COUNT(*) FILTER (WHERE "bowingAccuracy" IS NOT NULL) AS bowing,
      COUNT(*) FILTER (WHERE "overallScore" IS NOT NULL) AS overall
    FROM "PracticePerformance"
  `)
  console.log("[BEFORE]")
  console.log(`  Performance:         rhythm=${beforePerf[0].rhythm} bowing=${beforePerf[0].bowing} overall=${beforePerf[0].overall}`)
  console.log(`  PracticePerformance: rhythm=${beforePractice[0].rhythm} bowing=${beforePractice[0].bowing} overall=${beforePractice[0].overall}\n`)

  // Transaction で 6 UPDATE を atomic 実行
  await prisma.$transaction(async (tx) => {
    console.log("[TRANSACTION 開始]")

    // (a) Performance.rhythmAccuracy = timingAccuracy
    const a1 = await tx.$executeRawUnsafe(`
      UPDATE "Performance"
      SET "rhythmAccuracy" = "timingAccuracy"
      WHERE "rhythmAccuracy" IS NULL AND "timingAccuracy" IS NOT NULL
    `)
    console.log(`  (a) Performance.rhythmAccuracy backfill: ${a1} rows`)

    // (b) Performance.bowingAccuracy = bowingSkillScore
    const b1 = await tx.$executeRawUnsafe(`
      UPDATE "Performance"
      SET "bowingAccuracy" = "bowingSkillScore"
      WHERE "bowingAccuracy" IS NULL AND "bowingSkillScore" IS NOT NULL
    `)
    console.log(`  (b) Performance.bowingAccuracy backfill: ${b1} rows`)

    // (c) Performance.overallScore = (pitch + rhythm + bowing) / 3
    const c1 = await tx.$executeRawUnsafe(`
      UPDATE "Performance"
      SET "overallScore" = ROUND(
        (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
      )::float
      WHERE "pitchAccuracy" IS NOT NULL
        AND "rhythmAccuracy" IS NOT NULL
        AND "bowingAccuracy" IS NOT NULL
    `)
    console.log(`  (c) Performance.overallScore recompute: ${c1} rows`)

    // (a) PracticePerformance.rhythmAccuracy = timingAccuracy
    const a2 = await tx.$executeRawUnsafe(`
      UPDATE "PracticePerformance"
      SET "rhythmAccuracy" = "timingAccuracy"
      WHERE "rhythmAccuracy" IS NULL AND "timingAccuracy" IS NOT NULL
    `)
    console.log(`  (a) PracticePerformance.rhythmAccuracy backfill: ${a2} rows`)

    // (b) PracticePerformance.bowingAccuracy = bowingSkillScore
    const b2 = await tx.$executeRawUnsafe(`
      UPDATE "PracticePerformance"
      SET "bowingAccuracy" = "bowingSkillScore"
      WHERE "bowingAccuracy" IS NULL AND "bowingSkillScore" IS NOT NULL
    `)
    console.log(`  (b) PracticePerformance.bowingAccuracy backfill: ${b2} rows`)

    // (c) PracticePerformance.overallScore = (pitch + rhythm + bowing) / 3
    const c2 = await tx.$executeRawUnsafe(`
      UPDATE "PracticePerformance"
      SET "overallScore" = ROUND(
        (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
      )::float
      WHERE "pitchAccuracy" IS NOT NULL
        AND "rhythmAccuracy" IS NOT NULL
        AND "bowingAccuracy" IS NOT NULL
    `)
    console.log(`  (c) PracticePerformance.overallScore recompute: ${c2} rows`)

    console.log("[TRANSACTION COMMIT]\n")
  })

  // 実行後件数
  const afterPerf = await prisma.$queryRawUnsafe<Array<{
    rhythm: bigint; bowing: bigint; overall: bigint
  }>>(`
    SELECT
      COUNT(*) FILTER (WHERE "rhythmAccuracy" IS NOT NULL) AS rhythm,
      COUNT(*) FILTER (WHERE "bowingAccuracy" IS NOT NULL) AS bowing,
      COUNT(*) FILTER (WHERE "overallScore" IS NOT NULL) AS overall
    FROM "Performance"
  `)
  const afterPractice = await prisma.$queryRawUnsafe<Array<{
    rhythm: bigint; bowing: bigint; overall: bigint
  }>>(`
    SELECT
      COUNT(*) FILTER (WHERE "rhythmAccuracy" IS NOT NULL) AS rhythm,
      COUNT(*) FILTER (WHERE "bowingAccuracy" IS NOT NULL) AS bowing,
      COUNT(*) FILTER (WHERE "overallScore" IS NOT NULL) AS overall
    FROM "PracticePerformance"
  `)
  console.log("[AFTER]")
  console.log(`  Performance:         rhythm=${afterPerf[0].rhythm} bowing=${afterPerf[0].bowing} overall=${afterPerf[0].overall}`)
  console.log(`  PracticePerformance: rhythm=${afterPractice[0].rhythm} bowing=${afterPractice[0].bowing} overall=${afterPractice[0].overall}`)

  console.log("\n=== Backfill 完了 ===")
}

main()
  .catch((e) => {
    console.error("[ERROR]", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
