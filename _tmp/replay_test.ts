import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  const u = await prisma.user.findUnique({ where: { supabaseUserId: "a0952076-2a93-4270-876d-0d8ece45a647" }, select: { id: true } })
  const st = await prisma.userGuideState.findUnique({ where: { userId: u!.id } })
  console.log("state before:", JSON.stringify(st))
  await prisma.userGuideState.upsert({ where: { userId: u!.id },
    create: { userId: u!.id, completedAt: new Date() },
    update: { completedAt: new Date(), skippedAt: null, firstLoopStep: 0 } })
  console.log("set completed (もう一度見る前の状態を再現)")
  await prisma.$disconnect()
}
main()
