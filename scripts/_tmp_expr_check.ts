// 表現評価 (Phase0-3) の実データ検証: 癖系への漏れ防止 + 最新状態の昇格
import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const STUDENT = "cmrzmcrpy000004lbhwfodj6w"
  const st = await prisma.user.findUnique({ where: { id: STUDENT }, select: { supabaseUserId: true } })
  if (!st) throw new Error("no student")
  const k = await buildKarteData(STUDENT, st.supabaseUserId, "30d")
  const leak = (k.bodyObs ?? []).filter((t) => t.tagId.startsWith("expr_"))
  console.log(leak.length === 0 ? "✅ 癖マップにexprが漏れない" : "❌ 漏れ: " + JSON.stringify(leak))
  const evLeak = k.events.filter((e) => e.kind === "observation" && e.text.includes("：コメント"))
  console.log(evLeak.length === 0 ? "✅ あゆみにexprノイズなし" : "❌ ノイズ: " + evLeak.map((e) => e.text).join("|"))
  console.log("癖(left_wrist_collapse)は維持:", (k.bodyObs ?? []).some((t) => t.tagId === "left_wrist_collapse") ? "✅" : "❌")
  const rows = await prisma.teacherObservation.findMany({
    where: { studentId: STUDENT }, orderBy: { createdAt: "desc" }, take: 40, select: { tagIds: true, severity: true },
  })
  const exprs = rows.filter((o) => o.tagIds.some((t) => t.startsWith("expr_")))
  const latest = new Map<string, string | null>()
  for (const e of exprs) if (!latest.has(e.tagIds[0])) latest.set(e.tagIds[0], e.severity)
  console.log("先生側の最新状態:", JSON.stringify([...latest.entries()]))
  console.log(latest.get("expr_dynamics") === "improving" && latest.get("expr_tone_depth") === "strength" ? "✅ 昇格の時系列が正しい" : "❌")
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
