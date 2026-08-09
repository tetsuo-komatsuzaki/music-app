import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  const { SPOT_BY_TAG, BODY_VIEWS } = await import("../app/_libs/bodyMap")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const links = await prisma.teacherStudent.findMany({ select: { student: { select: { id: true, supabaseUserId: true, name: true } } } })
  for (const l of links) {
    const d = await buildKarteData(l.student.id, l.student.supabaseUserId, "all")
    console.log(`--- ${l.student.name} bodyObs=${d.bodyObs ? d.bodyObs.length : "null"} ---`)
    if (!d.bodyObs) continue
    for (const v of BODY_VIEWS) {
      const tags = d.bodyObs.filter((t) => SPOT_BY_TAG[t.tagId]?.view === v.id)
      if (tags.length) console.log(`  [${v.short}] ${tags.map((t) => `${t.tagId}(${SPOT_BY_TAG[t.tagId].label}/${t.severity ?? "-"}/${t.date})`).join(", ")}`)
    }
    const nb = d.bodyObs.filter((t) => !SPOT_BY_TAG[t.tagId])
    if (nb.length) console.log(`  [体の外] ${nb.map((t) => t.tagId).join(", ")}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
