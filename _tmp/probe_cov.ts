import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const r = await prisma.$queryRawUnsafe<Array<Record<string, bigint>>>(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "analysisSummary" -> 'diagnosis' -> 'per_subtask' IS NOT NULL) AS with_sub,
      COUNT(*) FILTER (WHERE "analysisSummary" -> 'noteStats' IS NOT NULL) AS with_ns,
      COUNT(*) FILTER (WHERE "uploadedAt" > NOW() - INTERVAL '60 days') AS last60,
      COUNT(*) FILTER (WHERE "uploadedAt" > NOW() - INTERVAL '60 days'
        AND "analysisSummary" -> 'diagnosis' -> 'per_subtask' IS NOT NULL) AS last60_sub
    FROM "Performance" WHERE "pitchAccuracy" IS NOT NULL AND "rangeFromNote" IS NULL`)
  console.log(Object.fromEntries(Object.entries(r[0]).map(([k, v]) => [k, Number(v)])))
  const p = await prisma.$queryRawUnsafe<Array<Record<string, bigint>>>(`
    SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "analysisSummary" -> 'diagnosis' -> 'per_subtask' IS NOT NULL) AS with_sub
    FROM "PracticePerformance" WHERE "pitchAccuracy" IS NOT NULL`)
  console.log("基礎練:", Object.fromEntries(Object.entries(p[0]).map(([k, v]) => [k, Number(v)])))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
