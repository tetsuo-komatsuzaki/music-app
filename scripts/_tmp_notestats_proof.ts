// noteStats (カルテv2 Phase0-2) のライブE2E証明。
// 既存の解析済み音源を複製→本番同一経路(Relay→Cloud Run v97)で解析→
// analysisSummary.noteStats (notes/registers/transitions) が付くか検証。
// 検証後は行と音源を削除する (--keep で残す)。
import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { createClient } = await import("@supabase/supabase-js")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const src = await prisma.performance.findFirst({
    where: { analysisStatus: "done", audioPath: { not: "" }, performanceType: "user" },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, scoreId: true, audioPath: true, recordingBpm: true, user: { select: { supabaseUserId: true } } },
  })
  if (!src) throw new Error("複製元なし")
  const ext = src.audioPath.split(".").pop() || "webm"
  const count = await prisma.performance.count({ where: { userId: src.userId, scoreId: src.scoreId } })
  const perf = await prisma.performance.create({
    data: { userId: src.userId, scoreId: src.scoreId, performanceType: "user", performanceStatus: "uploaded", name: `#${count + 1}`, audioPath: "", analysisStatus: "queued" },
  })
  const newPath = `${src.user.supabaseUserId}/${src.scoreId}/${perf.id}.${ext}`
  const cp = await storage.storage.from("performances").copy(src.audioPath, newPath)
  if (cp.error) { await prisma.performance.delete({ where: { id: perf.id } }); throw new Error(cp.error.message) }
  await prisma.performance.update({ where: { id: perf.id }, data: { audioPath: newPath } })
  console.log(`新規perf=${perf.id}`)

  const res = await fetch(`${process.env.RELAY_URL}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RELAY_API_KEY}` },
    body: JSON.stringify({
      mode: "analyze_performance", idempotency_key: `perf:${perf.id}`,
      user_id: src.userId, storage_user_id: src.user.supabaseUserId,
      score_id: src.scoreId, performance_id: perf.id, is_practice: false,
    }),
  })
  console.log(`invoke: HTTP ${res.status}`)
  if (!res.ok) throw new Error(await res.text())

  const t0 = Date.now()
  for (;;) {
    await new Promise((r) => setTimeout(r, 15000))
    const p = await prisma.performance.findUnique({ where: { id: perf.id }, select: { analysisStatus: true, analysisSummary: true } })
    const sec = Math.round((Date.now() - t0) / 1000)
    console.log(`[${sec}s] ${p?.analysisStatus}`)
    if (!p || p.analysisStatus === "done" || p.analysisStatus === "error" || sec > 720) {
      const sum = p?.analysisSummary as Record<string, unknown> | null
      const ns = sum?.noteStats as { notes?: Record<string, unknown>; registers?: Record<string, unknown>; transitions?: Record<string, unknown> } | undefined
      console.log("=== 結果 ===")
      console.log("keys:", sum ? Object.keys(sum) : null)
      if (ns) {
        console.log(`✅ noteStats: notes=${Object.keys(ns.notes ?? {}).length} registers=${Object.keys(ns.registers ?? {}).length} transitions=${Object.keys(ns.transitions ?? {}).length}`)
        console.log("notes例:", Object.entries(ns.notes ?? {}).slice(0, 3).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" / "))
        console.log("registers:", JSON.stringify(ns.registers))
        console.log("transitions例:", Object.entries(ns.transitions ?? {}).slice(0, 3).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" / "))
      } else {
        console.log("❌ noteStats なし")
      }
      if (!process.argv.includes("--keep")) {
        await prisma.performance.delete({ where: { id: perf.id } }).catch(() => {})
        await storage.storage.from("performances").remove([newPath]).catch(() => {})
        console.log("検証データ削除済")
      }
      break
    }
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
