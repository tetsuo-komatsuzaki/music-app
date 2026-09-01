import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
async function main() {
  const rows = await prisma.$queryRaw<{ d: string; n: bigint }[]>`
    SELECT to_char("createdAt" AT TIME ZONE 'Asia/Tokyo', 'MM/DD') AS d, count(*) AS n
    FROM "WaitlistEntry"
    GROUP BY 1 ORDER BY 1 DESC LIMIT 10`
  for (const r of rows) console.log(r.d, Number(r.n))
  console.log("total:", await prisma.waitlistEntry.count())
  await prisma.$disconnect()
}
main()
