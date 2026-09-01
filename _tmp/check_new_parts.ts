import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.practiceItem.findMany({
    where: { partId: { not: null }, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } },
    orderBy: { createdAt: "asc" },
    select: { title: true, articulation: true, analysisStatus: true, buildStatus: true },
  })
  console.log(rows.map((r) => `${r.title} [${r.articulation ?? "-"}] ${r.analysisStatus}/${r.buildStatus}`).join("\n"))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
