import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const g = await prisma.materialGroup.findFirst({
    where: { title: { contains: "No.1" }, kind: "ETUDE" },
    orderBy: { title: "asc" },
    select: { id: true, title: true, parts: true },
  })
  console.log("group:", g?.title, "parts:", Array.isArray(g?.parts) ? (g!.parts as unknown[]).length : 0)
  const items = await prisma.practiceItem.findMany({
    where: { groupId: g?.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, partId: true, articulation: true, rhythmRecipe: true,
      analysisStatus: true, buildStatus: true, isPublished: true, star: true },
  })
  console.log("\nid | title | part | art | rhythm.name | status | published | star")
  for (const i of items) {
    const rn = (i.rhythmRecipe as any)?.name ?? "-"
    console.log(`${i.title} | ${i.partId ? "P:" + i.partId.slice(-6) : "通し"} | ${i.articulation ?? "-"} | ${rn} | ${i.analysisStatus}/${i.buildStatus} | ${i.isPublished} | ★${i.star ?? "-"}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
