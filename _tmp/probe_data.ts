import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const perfCount = await prisma.performance.count({ where: { pitchAccuracy: { not: null }, rangeFromNote: null } })
  const users = await prisma.performance.groupBy({ by: ["userId"], where: { pitchAccuracy: { not: null } }, _count: true })
  const scores = await prisma.score.groupBy({ by: ["star"], where: { deletedAt: null }, _count: true })
  // 曲ごとの平均点と録音数 (難度較正の材料が足りるか)
  const rows = await prisma.$queryRawUnsafe<Array<{ star: number | null; songs: bigint; perfs: bigint; avg: number | null }>>(`
    SELECT s.star, COUNT(DISTINCT s.id) AS songs, COUNT(p.id) AS perfs,
           AVG((p."pitchAccuracy" + p."timingAccuracy")/2) AS avg
    FROM "Score" s LEFT JOIN "Performance" p
      ON p."scoreId" = s.id AND p."pitchAccuracy" IS NOT NULL AND p."rangeFromNote" IS NULL
    WHERE s."deletedAt" IS NULL
    GROUP BY s.star ORDER BY s.star`)
  console.log("採点済み通し録音:", perfCount, "/ ユーザー数:", users.length)
  console.log("ユーザー別録音数 上位:", users.map((u) => u._count).sort((a, b) => b - a).slice(0, 8))
  console.log("★別 曲数/録音数/平均点:")
  for (const r of rows) console.log(`  ★${r.star ?? "-"}: 曲${Number(r.songs)} 録音${Number(r.perfs)} 平均${r.avg != null ? Math.round(r.avg) : "-"}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
