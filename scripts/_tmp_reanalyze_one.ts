/**
 * 演奏 1 件だけの再解析 (2026-09-12)。奏法品質の測定値が古い録音で空なので、
 * 音声から解析し直して PerformanceNote の測定値列が埋まるかを確かめる。
 *
 *   DRY=1 PERF=<performanceId> npx tsx scripts/_tmp_reanalyze_one.ts   送る内容だけ表示
 *   PERF=<performanceId> npx tsx scripts/_tmp_reanalyze_one.ts         実行
 *   CHECK=1 PERF=<performanceId> npx tsx scripts/_tmp_reanalyze_one.ts 結果だけ確認
 *
 * 録音時の条件 (recordingBpm / guideOffsetSec) を DB から読んでそのまま渡す。
 * これを渡さないとテンポとリズムの起点が変わり、再解析で別の結果になる
 * ([[project_time_scale_recording_bpm]])。
 */
import { config } from "dotenv"
config()
import { randomUUID } from "crypto"

const DRY = process.env.DRY === "1"
const CHECK = process.env.CHECK === "1"
const PERF = process.env.PERF
const RELAY_URL = process.env.RELAY_URL
const RELAY_KEY = process.env.RELAY_API_KEY ?? process.env.RELAY_KEY

async function main() {
  if (!PERF) throw new Error("PERF=<performanceId> が要ります")
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")

  const p = await prisma.performance.findUnique({
    where: { id: PERF },
    select: {
      id: true, userId: true, scoreId: true, audioPath: true,
      recordingBpm: true, guideOffsetSec: true, uploadedAt: true,
      score: { select: { title: true } },
    },
  })
  if (!p) throw new Error(`Performance ${PERF} が見つからない`)

  const count = async () => {
    const r = await prisma.$queryRaw<{ notes: bigint; withDur: bigint; withAtk: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS notes,
             COUNT(*) FILTER (WHERE "durRatio" IS NOT NULL)::bigint AS "withDur",
             COUNT(*) FILTER (WHERE "attackPeakFrac" IS NOT NULL)::bigint AS "withAtk"
      FROM "PerformanceNote" WHERE "performanceId" = ${PERF}`)
    return r[0]
  }

  const before = await count()
  console.log(`対象: ${p.score.title} ・ ${p.uploadedAt.toISOString().slice(0, 10)}`)
  console.log(`  performanceId = ${p.id}`)
  console.log(`  userId        = ${p.userId}`)
  console.log(`  scoreId       = ${p.scoreId}`)
  console.log(`  音声          = ${p.audioPath ? "あり" : "なし"}`)
  console.log(`  recordingBpm  = ${p.recordingBpm ?? "(なし)"}`)
  console.log(`  guideOffsetSec= ${p.guideOffsetSec ?? "(なし)"}`)
  console.log(`  いまの測定値  = ${Number(before.withDur)}/${Number(before.notes)} 音 (durRatio) ・ ${Number(before.withAtk)} 音 (attackPeakFrac)`)

  if (CHECK) { await prisma.$disconnect(); return }

  const body: Record<string, unknown> = {
    mode: "analyze_performance",
    idempotency_key: `qualbf-${p.id}-${randomUUID().slice(0, 8)}`,
    user_id: p.userId,
    score_id: p.scoreId,
    performance_id: p.id,
    is_practice: false,
  }
  if (p.recordingBpm != null) body.recording_bpm = p.recordingBpm
  if (p.guideOffsetSec != null) body.guide_offset_sec = p.guideOffsetSec

  console.log("\n送る内容:", JSON.stringify(body, null, 1))
  if (DRY) { console.log("\nDRY のため投入しない"); await prisma.$disconnect(); return }
  if (!RELAY_URL || !RELAY_KEY) throw new Error("RELAY_URL / RELAY_API_KEY が要ります")

  const res = await fetch(`${RELAY_URL}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RELAY_KEY}` },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`\n投入: HTTP ${res.status} ${text.slice(0, 200)}`)
  if (!res.ok) { await prisma.$disconnect(); process.exit(1) }
  console.log("投入しただけでは何も分からない。数分おいて CHECK=1 で測定値を見ること。")
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
