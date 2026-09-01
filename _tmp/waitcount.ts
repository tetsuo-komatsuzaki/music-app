import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  const n = await prisma.waitlistEntry.count()
  const latest = await prisma.waitlistEntry.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })
  console.log("count:", n, "latest:", latest?.createdAt?.toISOString())
  await prisma.$disconnect()
}
main()
