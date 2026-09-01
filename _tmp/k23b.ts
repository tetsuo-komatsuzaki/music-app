import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  for (const no of ["No.23", "No.24", "No.17"]) {
    const items = await prisma.practiceItem.findMany({
      where: { title: { contains: no }, category: "etude" },
      select: { id: true, title: true, partId: true, originalXmlPath: true, generatedXmlPath: true, groupId: true },
    })
    for (const it of items.filter(i => /カイザー|Kayser/i.test(i.title))) console.log(JSON.stringify(it))
  }
  await prisma.$disconnect()
}
main()
