import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const SUPA = "16c0f52b-3000-4beb-ad66-0454a8b4ec85"
  const u = await prisma.user.findUnique({
    where: { supabaseUserId: SUPA },
    select: { id: true, name: true, createdAt: true,
      _count: { select: { scores: true, performances: true } } },
  })
  console.log("User:", u ? `${u.name} / 曲${u._count.scores} 演奏${u._count.performances} / ${u.createdAt.toISOString().slice(0,10)}` : "DBに無し")
}
main().finally(()=>prisma.$disconnect())
