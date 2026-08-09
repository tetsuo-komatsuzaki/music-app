import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { SKILL_SUB_DEFS } = await import("../app/_libs/growthKarte")
  const { SUBTASK_CATALOG } = await import("../app/_libs/subtaskCatalog.generated")
  const { buildSubMap, computeGrowthLine } = await import("../app/_libs/growthLine")
  const DEFS = [
    ...SKILL_SUB_DEFS.map((d: {label:string; subIds:string[]}) => ({ ...d, priority: 1 })),
    ...SUBTASK_CATALOG.filter((s: {v1Active:boolean; diagnosable:boolean}) => s.v1Active && s.diagnosable)
      .map((s: {name:string; id:string}) => ({ label: s.name, subIds: [s.id], priority: 0 })),
  ]
  // 直近の採点済み演奏 10件で成長1行を試算
  const perfs = await prisma.performance.findMany({
    where: { pitchAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" }, take: 10,
    select: { id: true, userId: true, uploadedAt: true, analysisSummary: true, score: { select: { title: true } } },
  })
  for (const p of perfs) {
    const since = new Date(p.uploadedAt.getTime() - 30 * 864e5)
    const [pp, pr] = await Promise.all([
      prisma.performance.findMany({ where: { userId: p.userId, uploadedAt: { gte: since, lt: p.uploadedAt }, id: { not: p.id } }, select: { analysisSummary: true } }),
      prisma.practicePerformance.findMany({ where: { userId: p.userId, uploadedAt: { gte: since, lt: p.uploadedAt } }, select: { analysisSummary: true } }),
    ])
    const line = computeGrowthLine(buildSubMap([p.analysisSummary]), buildSubMap([...pp, ...pr].map(r => r.analysisSummary)), DEFS)
    console.log(p.score.title.slice(0, 12), p.uploadedAt.toISOString().slice(0, 10), "base_n=", pp.length + pr.length, "->", line ? `${line.label} ${line.from}→${line.to}%` : "null")
  }
}
main()
