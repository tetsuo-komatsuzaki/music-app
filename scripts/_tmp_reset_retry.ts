import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const r = await prisma.performance.update({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    data: { retryCount: 0 },
    select: { id: true, retryCount: true, analysisStatus: true },
  })
  console.log(r)
}
main().finally(() => prisma.$disconnect())
