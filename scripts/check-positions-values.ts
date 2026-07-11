import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `select unnest(positions) as v, count(*)::int as c from "PracticeItem" group by v order by c desc`
  )
  console.log("PracticeItem.positions の実値:")
  for (const r of rows) console.log(`  ${JSON.stringify(r.v)} : ${r.c}件`)
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
