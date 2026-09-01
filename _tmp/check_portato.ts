import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.practiceItem.findMany({
    where: { title: { contains: "No.1" }, title: undefined, OR: [{ title: { contains: "カイザー" } }] },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, articulation: true, partId: true, analysisStatus: true, buildStatus: true, errorMessage: true, createdAt: true },
  })
  for (const r of rows.filter((r) => r.title.includes("No.1"))) {
    console.log(`${r.title} [${r.articulation ?? "-"}] part=${r.partId ?? "-"} ${r.analysisStatus}/${r.buildStatus} ${r.errorMessage ?? ""} ${r.createdAt.toISOString().slice(11, 16)}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
