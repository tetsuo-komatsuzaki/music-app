import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const links = await prisma.teacherStudent.findMany({ select: { student: { select: { id: true, supabaseUserId: true, name: true } } } })
  console.log(`teacher links: ${links.length}`)
  for (const l of links) {
    const d = await buildKarteData(l.student.id, l.student.supabaseUserId, "all")
    console.log(`--- ${l.student.name} ---`)
    if (!d.skillMap) { console.log("skillMap=null"); continue }
    console.log(`currentStar=${d.skillMap.currentStar}`)
    for (const n of d.skillMap.nodes) {
      console.log(`  ${n.lane === "bow" ? "弓" : "左"} ★${n.star} ${n.label.padEnd(12)} ${n.state}${n.provisional ? "(仮)" : ""} pct=${n.pct ?? "-"} (${n.miss}/${n.target}) obs=[${n.obsTags.join(",")}]`)
    }
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
