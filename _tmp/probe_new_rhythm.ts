import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { Prisma } from "../app/generated/prisma"
async function main() {
  const rows = await prisma.practiceItem.findMany({
    where: { rhythmRecipe: { not: Prisma.DbNull } },
    orderBy: { createdAt: "asc" },
    select: { title: true, partId: true, analysisStatus: true, buildStatus: true, errorMessage: true, rhythmRecipe: true },
  })
  console.log("リズム登録あり:", rows.length, "件")
  for (const r of rows) {
    const name = (r.rhythmRecipe as any)?.name
    console.log(`  ${r.title} | part=${r.partId ? "あり" : "通し"} | ${r.analysisStatus}/${r.buildStatus} | recipe=${name} ${r.errorMessage ?? ""}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
