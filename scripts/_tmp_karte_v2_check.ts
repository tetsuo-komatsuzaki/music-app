// カルテv2 (Phase1) の実データ検証: KPI/表現/発見/虫めがね/きみの歴史/ノード拡張
import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const users = await prisma.teacherStudent.findMany({ select: { student: { select: { id: true, supabaseUserId: true, name: true } } } })
  for (const u of users) {
    const t0 = Date.now()
    const k = await buildKarteData(u.student.id, u.student.supabaseUserId, "30d")
    console.log(`\n=== ${u.student.name} (${Date.now() - t0}ms) ===`)
    console.log("arcoLine:", k.v2.arcoLine)
    console.log("kpi:", JSON.stringify(k.v2.kpi))
    console.log("expression:", k.v2.expression ? `💪${k.v2.expression.strengths.map((s) => s.label).join(",")} / 🔥${k.v2.expression.growing.map((s) => s.label + (s.status === "improving" ? "🌿" : "")).join(",")}` : "null")
    console.log("discovery.keyWorst:", JSON.stringify(k.v2.discovery.keyWorst))
    console.log("discovery.registerWorst:", JSON.stringify(k.v2.discovery.registerWorst))
    console.log("discovery.lens:", JSON.stringify(k.v2.discovery.lens))
    console.log("milestones:", k.v2.milestones.length, "件 →", k.v2.milestones.slice(0, 6).map((m) => `${m.date}${m.icon}${m.text}`).join(" / "))
    const withBars = (k.skillMap?.nodes ?? []).filter((n) => n.pitchPct != null || n.rhythmPct != null)
    console.log("nodes 2本バーあり:", withBars.map((n) => `${n.label}(P${n.pitchPct ?? "—"}/R${n.rhythmPct ?? "—"}${n.weekDelta != null ? ` Δ${n.weekDelta}` : ""}${n.isNew ? " NEW" : ""} s${n.series.length})`).join(" "))
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
