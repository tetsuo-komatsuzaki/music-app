import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.practiceItem.findMany({
    where: { title: { contains: "カイザー" } },
    orderBy: { createdAt: "desc" }, take: 5,
    select: { id: true, title: true, articulation: true, analysisStatus: true, buildStatus: true, errorMessage: true, createdAt: true },
  })
  console.log(JSON.stringify(rows, null, 1))
  const sc = await prisma.score.findMany({
    where: { title: { contains: "カイザー" } },
    orderBy: { createdAt: "desc" }, take: 5,
    select: { id: true, title: true, createdAt: true },
  })
  console.log(JSON.stringify(sc, null, 1))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
