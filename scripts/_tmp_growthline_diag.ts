import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const perfs = await prisma.performance.findMany({
    where: { pitchAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" }, take: 6,
    select: { uploadedAt: true, analysisSummary: true, score: { select: { title: true } } },
  })
  for (const p of perfs) {
    const d = (p.analysisSummary as { diagnosis?: { per_subtask?: Record<string, { miss: number; target: number }> } } | null)?.diagnosis
    const keys = d?.per_subtask ? Object.entries(d.per_subtask).filter(([k]) => k.includes("tech")).map(([k, v]) => `${k}(${v.miss}/${v.target})`) : []
    console.log(p.score.title.slice(0, 10), "| tech系:", keys.length ? keys.join(" ") : "(なし)", "| 全key数:", d?.per_subtask ? Object.keys(d.per_subtask).length : 0)
  }
}
main()
