import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  for (const cat of ["bowing", "fingering", "position_shift"]) {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      select pi.title,
        coalesce(nullif(pi."keyTonic",''),'-') as k,
        coalesce(pi.star,-1) as star,
        (select string_agg(t.name, ',') from "PracticeItemTechnique" pit
          join "TechniqueTag" t on t.id = pit."techniqueTagId"
          where pit."practiceItemId" = pi.id) as tech
      from "PracticeItem" pi
      where pi.category = '${cat}'
      order by pi.title
      limit 15
    `)
    const total = await prisma.$queryRawUnsafe<any[]>(
      `select count(*)::int as c from "PracticeItem" where category='${cat}'`
    )
    console.log(`\n===== ${cat} (計${total[0].c}件・先頭15) =====`)
    for (const r of rows) console.log(`${r.title} | ${r.k} ★${r.star} | ${r.tech ?? "-"}`)
  }
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
