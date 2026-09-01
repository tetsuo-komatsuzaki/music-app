import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const r = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT to_char("uploadedAt", 'YYYY-MM') AS m, COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "analysisSummary" -> 'diagnosis' -> 'per_subtask' IS NOT NULL) AS sub,
      COUNT(*) FILTER (WHERE "analysisSummary" IS NOT NULL) AS has_summary
    FROM "Performance" WHERE "pitchAccuracy" IS NOT NULL AND "rangeFromNote" IS NULL
    GROUP BY 1 ORDER BY 1 DESC LIMIT 8`)
  for (const x of r) console.log(`${x.m}: 録音${Number(x.total)} summary有${Number(x.has_summary)} per_subtask有${Number(x.sub)}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
