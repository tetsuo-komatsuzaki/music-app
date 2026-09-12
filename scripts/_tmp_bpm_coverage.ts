import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")
  const r = await prisma.$queryRaw<{ tot: bigint; withBpm: bigint; noBpm: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS tot,
           COUNT(*) FILTER (WHERE "recordingBpm" IS NOT NULL)::bigint AS "withBpm",
           COUNT(*) FILTER (WHERE "recordingBpm" IS NULL)::bigint AS "noBpm"
    FROM "Performance" WHERE "audioPath" IS NOT NULL AND "audioPath" <> ''`)
  const x = r[0]
  console.log(`音声が残る演奏 ${Number(x.tot)} 件`)
  console.log(`  recordingBpm あり ${Number(x.withBpm)} 件  → 再解析しても条件を再現できる`)
  console.log(`  recordingBpm なし ${Number(x.noBpm)} 件  → 1.0 fallback になり結果が変わる`)
  const t = await prisma.$queryRaw<{ at: Date; title: string; bpm: number | null; n: bigint }[]>(Prisma.sql`
    SELECT x."uploadedAt" AS at, o.title, x."recordingBpm" AS bpm, COUNT(pn.*)::bigint AS n
    FROM "Performance" x JOIN "Score" o ON o.id = x."scoreId"
    LEFT JOIN "PerformanceNote" pn ON pn."performanceId" = x.id AND pn."performanceKind"='score'::"PerformanceKind"
    WHERE x."audioPath" IS NOT NULL AND x."audioPath" <> '' AND x."recordingBpm" IS NOT NULL
    GROUP BY 1,2,3 ORDER BY 1 DESC LIMIT 6`)
  console.log("\nrecordingBpm がある演奏の例:")
  for (const r2 of t) console.log(`  ${r2.at.toISOString().slice(0,10)}  ${r2.title.slice(0,14).padEnd(15)} bpm=${r2.bpm}  ${Number(r2.n)}音`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
