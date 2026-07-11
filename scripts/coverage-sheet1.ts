import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  for (const cat of ["scale", "arpeggio"]) {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      select
        coalesce(nullif("keyTonic",''),'(null)') as tonic,
        coalesce(nullif("keyMode",''),'(null)') as mode,
        coalesce(star,-1) as star,
        count(*)::int as c
      from "PracticeItem"
      where category = '${cat}'
      group by "keyTonic","keyMode",star
      order by mode, tonic, star
    `)
    console.log(`\n===== ${cat} : 調 × ★（実在） =====`)
    console.log("調(tonic mode) | ★ | 件数")
    for (const r of rows) {
      console.log(`${r.tonic} ${r.mode} | ★${r.star} | ${r.c}`)
    }
    // モード別ユニーク調数
    const modes = await prisma.$queryRawUnsafe<any[]>(`
      select coalesce(nullif("keyMode",''),'(null)') as mode,
             count(distinct "keyTonic")::int as keys,
             count(*)::int as total
      from "PracticeItem" where category='${cat}'
      group by "keyMode"
    `)
    console.log(`-- ${cat} モード内訳 --`)
    for (const m of modes) console.log(`  ${m.mode}: ${m.keys}調 / ${m.total}件`)
  }
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
