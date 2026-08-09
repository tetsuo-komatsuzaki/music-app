import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
})

async function main() {
  const rows = await prisma.score.findMany({
    where: {
      deletedAt: null,
      ownerScope: "admin",
      star: { not: null },
      keyTonic: { not: null },
      keyMode: { not: null },
    },
    select: {
      id: true, title: true, star: true,
      keyTonic: true, keyMode: true, skillSubTaskTags: true,
    },
    take: 20,
  })
  console.log(`key+star 設定済 admin Score: ${rows.length} 件`)
  for (const r of rows) {
    console.log(
      `  ${r.id}  ★${r.star}  ${r.keyTonic} ${r.keyMode}  ` +
        `tags=${JSON.stringify(r.skillSubTaskTags)}  「${r.title}」`,
    )
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
