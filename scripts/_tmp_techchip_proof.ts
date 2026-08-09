import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const rows = await prisma.practiceItemTechnique.findMany({
    select: { practiceItem: { select: { category: true } }, techniqueTag: { select: { name: true } } },
  })
  const byCat: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    const c = r.practiceItem.category
    byCat[c] = byCat[c] ?? {}
    byCat[c][r.techniqueTag.name] = (byCat[c][r.techniqueTag.name] ?? 0) + 1
  }
  console.log(JSON.stringify(byCat, null, 1))
}
main()
