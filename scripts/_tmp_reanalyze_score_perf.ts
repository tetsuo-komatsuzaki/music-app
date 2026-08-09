// scripts/_tmp_reanalyze_score_perf.ts
//
// 指定 supabaseUserId + scoreId の最新 Performance に対して analyze_performance を
// re-trigger する (Cloud Run Job 再実行)。relay-service の /invoke を叩く。
//
// 実行: npx tsx scripts/_tmp_reanalyze_score_perf.ts <supabaseUserId> <scoreId>
// 例:   npx tsx scripts/_tmp_reanalyze_score_perf.ts a0952076-2a93-4270-876d-0d8ece45a647 cmpl3hl8e000204l74lvsktfx

import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const supabaseUserId = process.argv[2]
  const scoreId = process.argv[3]
  if (!supabaseUserId || !scoreId) {
    console.error("Usage: npx tsx scripts/_tmp_reanalyze_score_perf.ts <supabaseUserId> <scoreId>")
    process.exit(1)
  }

  const relayUrl = process.env.RELAY_URL
  const relayKey = process.env.RELAY_API_KEY
  if (!relayUrl || !relayKey) {
    console.error("RELAY_URL / RELAY_API_KEY 環境変数が必要")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
    select: { id: true, name: true },
  })
  if (!user) {
    console.error(`User not found: ${supabaseUserId}`)
    process.exit(1)
  }
  console.log(`User: ${user.name} (internal id=${user.id})`)

  const perf = await prisma.performance.findFirst({
    where: { userId: user.id, scoreId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, uploadedAt: true, analysisStatus: true,
      pitchAccuracy: true, rhythmAccuracy: true, overallScore: true,
    },
  })
  if (!perf) {
    console.error(`Performance not found for user=${user.id} score=${scoreId}`)
    process.exit(1)
  }
  console.log(`\nLatest Performance:`)
  console.log(`  id: ${perf.id}`)
  console.log(`  uploadedAt: ${perf.uploadedAt.toISOString()}`)
  console.log(`  current status: ${perf.analysisStatus}`)
  console.log(`  current pitch=${perf.pitchAccuracy} rhythm=${perf.rhythmAccuracy} overall=${perf.overallScore}\n`)

  const idempotencyKey = `reanalyze-${perf.id}-${Date.now()}-${randomUUID().slice(0, 8)}`

  console.log(`Triggering relay /invoke ...`)
  const res = await fetch(`${relayUrl}/invoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${relayKey}`,
    },
    body: JSON.stringify({
      mode: "analyze_performance",
      idempotency_key: idempotencyKey,
      user_id: user.id,
      score_id: scoreId,
      performance_id: perf.id,
      is_practice: false,
    }),
  })
  const body = await res.text()
  console.log(`\nrelay status: ${res.status}`)
  console.log(`relay body: ${body}`)

  if (!res.ok) {
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())
