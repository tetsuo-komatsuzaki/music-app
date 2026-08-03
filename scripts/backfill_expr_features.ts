// 表現特徴の既存曲バックフィル (2026-08-04)。ensureExprFeatures を全共有曲に適用
import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { ensureExprFeatures } = await import("../app/_libs/exprSongMatch.server")
  const rows = await prisma.score.findMany({
    where: { ownerScope: "admin", isShared: true, deletedAt: null, analysisStatus: "done" },
    select: { id: true, title: true, createdById: true, defaultTempo: true, exprFeatures: true, star: true },
  })
  console.log("対象:", rows.length, "曲")
  let done = 0
  for (let i = 0; i < rows.length; i += 12) {
    const m = await ensureExprFeatures(rows.slice(i, i + 12))
    done += m.size
  }
  console.log("特徴量あり:", done, "/", rows.length)
  const sample = await prisma.score.findMany({
    where: { exprFeatures: { not: { equals: null } } }, take: 5,
    select: { title: true, exprFeatures: true },
  })
  for (const s of sample) console.log(s.title.slice(0, 12), JSON.stringify(s.exprFeatures))
}
main()
