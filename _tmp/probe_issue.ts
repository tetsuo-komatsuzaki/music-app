import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.performance.findMany({
    where: { analysisSummary: { not: undefined }, pitchAccuracy: { not: null } },
    select: { analysisSummary: true },
  })
  const issues = new Map<string, number>()
  let mp: unknown = null, pos: unknown = null, mpr: unknown = null
  for (const r of rows) {
    const a = r.analysisSummary as any
    if (a?.primaryIssue) issues.set(a.primaryIssue, (issues.get(a.primaryIssue) ?? 0) + 1)
    if (!mp && a?.diagnosis?.miss_patterns?.pitch) mp = a.diagnosis.miss_patterns.pitch
    if (!mpr && a?.diagnosis?.miss_patterns?.rhythm) mpr = a.diagnosis.miss_patterns.rhythm
    if (!pos && a?.noteStats?.positions) pos = a.noteStats.positions
  }
  console.log("primaryIssue の分布:", [...issues.entries()].sort((a,b)=>b[1]-a[1]))
  console.log("\nmiss_patterns.pitch:", JSON.stringify(mp, null, 1)?.slice(0, 700))
  console.log("\nmiss_patterns.rhythm:", JSON.stringify(mpr, null, 1)?.slice(0, 500))
  console.log("\nnoteStats.positions:", JSON.stringify(pos)?.slice(0, 300))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
