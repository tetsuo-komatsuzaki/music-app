// diagnosis が書かれる曲/書かれない曲の差 + PracticePerformance の実態 (読み取りのみ)
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  for (const title of ["アルプス一万尺", "ふるさと"]) {
    const s = await prisma.score.findFirst({
      where: { title: { contains: title } },
      select: {
        id: true, title: true, isShared: true, star: true, buildStatus: true, analysisStatus: true,
        keyTonic: true, groupId: true, createdBy: { select: { role: true, name: true } },
      },
    })
    console.log(title, JSON.stringify(s))
  }

  const pracCount = await prisma.practicePerformance.count()
  const pracDone = await prisma.practicePerformance.count({ where: { analysisStatus: "done" } })
  console.log(`PracticePerformance: 全${pracCount}件 (done=${pracDone})`)

  // 直近の practice 録音 (あれば)
  const pr = await prisma.practicePerformance.findMany({
    orderBy: { uploadedAt: "desc" }, take: 3,
    select: { uploadedAt: true, analysisStatus: true, analysisSummary: true },
  })
  for (const r of pr) {
    const s = r.analysisSummary as Record<string, unknown> | null
    console.log(`practice ${r.uploadedAt.toISOString().slice(0, 10)} status=${r.analysisStatus} keys=${s ? Object.keys(s).join(",") : "(null)"}`)
  }

  // diagnosis 付き録音の総数 (JSON path 検索は重いので全走査)
  const allPerfs = await prisma.performance.findMany({ select: { analysisSummary: true, uploadedAt: true } })
  let withDiag = 0
  let latestDiag: string | null = null
  for (const p of allPerfs) {
    const d = (p.analysisSummary as { diagnosis?: unknown } | null)?.diagnosis
    if (d) { withDiag++; const dt = p.uploadedAt.toISOString().slice(0, 10); if (!latestDiag || dt > latestDiag) latestDiag = dt }
  }
  console.log(`Performance全${allPerfs.length}件中 diagnosisあり=${withDiag}件 (最新=${latestDiag})`)

  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
