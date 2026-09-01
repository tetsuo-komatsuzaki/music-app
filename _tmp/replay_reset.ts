import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  const u = await prisma.user.findUnique({ where: { supabaseUserId: "a0952076-2a93-4270-876d-0d8ece45a647" }, select: { id: true } })
  await prisma.userGuideState.update({ where: { userId: u!.id }, data: { firstLoopStep: 0, completedAt: null, skippedAt: null } })
  console.log("reset ok")
  await prisma.$disconnect()
}
main()
