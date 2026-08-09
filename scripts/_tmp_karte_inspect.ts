// analysisSummary の実際の形を確認 (読み取りのみ)
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const rows = await prisma.performance.findMany({
    where: { analysisSummary: { not: undefined } },
    orderBy: { uploadedAt: "desc" },
    take: 6,
    select: { uploadedAt: true, analysisStatus: true, analysisSummary: true, score: { select: { title: true } } },
  })
  for (const r of rows) {
    const s = r.analysisSummary as Record<string, unknown> | null
    const keys = s ? Object.keys(s) : []
    const diag = s?.diagnosis as Record<string, unknown> | undefined
    console.log(`${r.uploadedAt.toISOString().slice(0, 10)} ${r.score?.title?.slice(0, 16) ?? "?"} status=${r.analysisStatus}`)
    console.log(`  keys: ${keys.join(", ") || "(null)"}`)
    if (diag) {
      console.log(`  diagnosis keys: ${Object.keys(diag).join(", ")}`)
      const ps = diag.per_subtask as Record<string, unknown> | undefined
      console.log(`  per_subtask: ${ps ? Object.keys(ps).length + "件" : "なし"} map_available=${String(diag.map_available)}`)
    }
  }

  const pr = await prisma.practicePerformance.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 4,
    select: { uploadedAt: true, analysisSummary: true, practiceItem: { select: { title: true } } },
  })
  console.log("--- practice ---")
  for (const r of pr) {
    const s = r.analysisSummary as Record<string, unknown> | null
    const diag = s?.diagnosis as Record<string, unknown> | undefined
    const ps = diag?.per_subtask as Record<string, unknown> | undefined
    console.log(`${r.uploadedAt.toISOString().slice(0, 10)} ${r.practiceItem?.title?.slice(0, 16) ?? "?"} keys=${s ? Object.keys(s).join(",") : "(null)"} per_subtask=${ps ? Object.keys(ps).length : "-"}`)
  }

  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
