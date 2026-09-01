import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const r = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
    SELECT p."userId", u.role, u."supabaseUserId" IS NOT NULL AS has_sb, COUNT(*) AS total,
      COUNT(*) FILTER (WHERE p."analysisSummary" IS NOT NULL) AS summary,
      MIN(p."uploadedAt")::date AS first, MAX(p."uploadedAt")::date AS last
    FROM "Performance" p JOIN "User" u ON u.id = p."userId"
    WHERE p."pitchAccuracy" IS NOT NULL AND p."rangeFromNote" IS NULL
    GROUP BY 1,2,3 ORDER BY total DESC`)
  for (const x of r) console.log(`${String(x.userId).slice(0,8)} [${x.role}] 録音${Number(x.total)} summary有${Number(x.summary)} ${x.first}〜${x.last}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
