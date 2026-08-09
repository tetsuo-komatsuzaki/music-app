// ライブ217診断のE2E証明 (2026-08-02)。
// 既存の解析済み演奏の音源を複製→新規Performanceとして本番と同じ経路(Relay→Cloud Run job v96)で
// 解析を起動し、analysisSummary.diagnosis (per_subtask) がライブで付くかを検証する。
// 実録音の代替 = 本物の音源バイト列を使うので、パイプライン検証としては等価。
import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { createClient } = await import("@supabase/supabase-js")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // 1. 複製元: 解析doneかつ音源ありの最新演奏
  const src = await prisma.performance.findFirst({
    where: { analysisStatus: "done", audioPath: { not: "" }, performanceType: "user" },
    orderBy: { createdAt: "desc" },
    select: { id: true, userId: true, scoreId: true, audioPath: true, analysisSummary: true,
      user: { select: { supabaseUserId: true } } },
  })
  if (!src) throw new Error("複製元の演奏が見つからない")
  const ext = src.audioPath.split(".").pop() || "webm"
  console.log(`複製元: perf=${src.id} score=${src.scoreId} path=${src.audioPath}`)

  // 2. 新規Performance行 (getSignedUploadUrl Step A-D と同形)
  const count = await prisma.performance.count({ where: { userId: src.userId, scoreId: src.scoreId } })
  const perf = await prisma.performance.create({
    data: {
      userId: src.userId, scoreId: src.scoreId, performanceType: "user",
      performanceStatus: "uploaded", name: `#${count + 1}`, audioPath: "", analysisStatus: "queued",
    },
  })
  const newPath = `${src.user.supabaseUserId}/${src.scoreId}/${perf.id}.${ext}`

  // 3. 音源複製 (storage copy)
  const cp = await storage.storage.from("performances").copy(src.audioPath, newPath)
  if (cp.error) { await prisma.performance.delete({ where: { id: perf.id } }); throw new Error(`storage copy失敗: ${cp.error.message}`) }
  await prisma.performance.update({ where: { id: perf.id }, data: { audioPath: newPath } })
  console.log(`新規: perf=${perf.id} path=${newPath}`)

  // 4. 本番同一経路で解析起動 (Relay)
  const res = await fetch(`${process.env.RELAY_URL}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RELAY_API_KEY}` },
    body: JSON.stringify({
      mode: "analyze_performance",
      idempotency_key: `perf:${perf.id}`,
      user_id: src.userId,
      storage_user_id: src.user.supabaseUserId,
      score_id: src.scoreId,
      performance_id: perf.id,
      is_practice: false,
    }),
  })
  const invokeBody = await res.text()
  console.log(`invoke: HTTP ${res.status} ${invokeBody.slice(0, 200)}`)
  if (!res.ok) throw new Error("invoke失敗")

  // 5. ポーリング (最大12分)
  const t0 = Date.now()
  for (;;) {
    await new Promise((r) => setTimeout(r, 15000))
    const p = await prisma.performance.findUnique({
      where: { id: perf.id },
      select: { analysisStatus: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true },
    })
    const sec = Math.round((Date.now() - t0) / 1000)
    console.log(`[${sec}s] status=${p?.analysisStatus} pitch=${p?.pitchAccuracy} timing=${p?.timingAccuracy}`)
    if (!p || p.analysisStatus === "done" || p.analysisStatus === "error") {
      const sum = p?.analysisSummary as Record<string, unknown> | null
      const diag = sum?.diagnosis as Record<string, unknown> | undefined
      console.log("=== 結果 ===")
      console.log("analysisStatus:", p?.analysisStatus)
      console.log("analysisSummary keys:", sum ? Object.keys(sum) : null)
      console.log("diagnosis keys:", diag ? Object.keys(diag) : "★なし★")
      const per = diag?.per_subtask as Record<string, unknown> | undefined
      console.log("per_subtask 件数:", per ? Object.keys(per).length : 0)
      if (per) console.log("per_subtask 例:", Object.entries(per).slice(0, 5).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" / "))
      console.log(diag && per && Object.keys(per).length > 0 ? "✅ ライブ診断 付与確認" : "❌ 診断なし")
      break
    }
    if (sec > 720) { console.log("timeout"); break }
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
