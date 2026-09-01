import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  const rows = await prisma.score.findMany({
    where: { deletedAt: null, star: null },
    select: { id: true, title: true, createdAt: true, keyTonic: true, keyMode: true,
      createdBy: { select: { name: true, role: true } },
      performances: { select: { id: true }, take: 1 },
    },
  })
  for (const r of rows) {
    console.log(r.title, "|", r.createdBy?.name, r.createdBy?.role, "| key:", r.keyTonic, r.keyMode, "| perf有:", r.performances.length > 0, "|", r.createdAt.toISOString().slice(0, 10), "|", r.id)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
