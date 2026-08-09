import { config } from "dotenv"
config()
async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildSkillDetail } = await import("../app/_libs/growthKarte")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const link = await prisma.teacherStudent.findFirst({ select: { student: { select: { id: true, supabaseUserId: true, name: true } } } })
  if (!link) { console.log("no links"); return }
  for (const tech of ["slur", "position", "staccato"]) {
    const d = await buildSkillDetail(link.student.id, link.student.supabaseUserId, tech)
    if (!d) { console.log(tech, "null"); continue }
    console.log(`${tech}: state=${d.state} pct=${d.pct ?? "-"} series=${d.series.length}点 annos=${d.annotations.length} guidance=${d.guidance.length} listen=${d.listen ? `${d.listen.old.date}(${d.listen.old.pct}%)→${d.listen.new.date}(${d.listen.new.pct}%) audio=${!!d.listen.old.audioUrl}/${!!d.listen.new.audioUrl}` : "-"} effect=${d.effect ? d.effect.label + " " + d.effect.delta : "-"}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
