import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const ids = ["cmmvfqz7700c158jyr07ersp3", "cmooefqcw0001h8jyarerbj7a", "cmooefsa10021h8jykdmxih7s", "cmmvfqu1t00a358jy19p09787", "cmmvq0ef8000vw8jybi8791d1", "cmpx2sjff000004l5tx3zmf8j"]
  const found = await prisma.practiceItem.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
  console.log(`現存itemId: ${found.length}/${ids.length}`)
  for (const f of found) console.log(" -", f.id.slice(0, 8), f.title)
  const total = await prisma.practiceItem.count()
  console.log("PracticeItem総数:", total)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
