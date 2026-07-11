import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    select
      category::text as category,
      count(*)::int as total,
      count(*) filter (where "analysisPath" is not null)::int as has_analysis,
      count(*) filter (where array_length(positions,1) is not null)::int as has_positions
    from "PracticeItem"
    group by category order by category
  `)
  console.log("category | total | analysisPath有 | positions有")
  for (const r of rows) {
    console.log(`${r.category} | ${r.total} | ${r.has_analysis} | ${r.has_positions}`)
  }

  const sample = await prisma.$queryRawUnsafe<any[]>(`
    select category::text as category, "originalXmlPath", "analysisPath"
    from "PracticeItem"
    order by category limit 8
  `)
  console.log("\n-- パス形式サンプル --")
  for (const s of sample) {
    console.log(`[${s.category}] xml=${s.originalXmlPath} | analysis=${s.analysisPath ?? "(null)"}`)
  }
}

main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
