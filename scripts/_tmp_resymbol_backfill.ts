// v91 バックフィル: 全教材・全曲を再解析し、記号ガイド用の新フィールド
// (expressions / accidental / notehead / dots / voice / has_lyric) を書き込む。
//
// Cloud Run のクォータ「Job run requests per minute per region = 60」に対し
// 2.5 秒間隔で投げる (過去に 1.3 秒で 429 を踏んだため)。
import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const SPACING_MS = 2500

type Target = { kind: "practice" | "score"; id: string; title: string; userId?: string }

async function main() {
  const relayUrl = process.env.RELAY_URL!
  const relayKey = process.env.RELAY_API_KEY!
  const dryRun = process.env.DRY_RUN === "1"

  const items = await prisma.practiceItem.findMany({
    where: { buildStatus: "done" },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  })
  const scores = await prisma.score.findMany({
    where: { buildStatus: "done", deletedAt: null },
    select: { id: true, title: true, createdById: true },
    orderBy: { createdAt: "asc" },
  })

  const targets: Target[] = [
    ...items.map((i) => ({ kind: "practice" as const, id: i.id, title: i.title })),
    ...scores.map((s) => ({ kind: "score" as const, id: s.id, title: s.title, userId: s.createdById })),
  ]
  console.log(`対象: 教材 ${items.length} 件 + 曲 ${scores.length} 件 = ${targets.length} 件`)
  console.log(`推定所要: 約 ${Math.ceil((targets.length * SPACING_MS) / 60000)} 分`)
  if (dryRun) return

  let ok = 0
  const failures: { id: string; title: string; kind: string; reason: string }[] = []

  for (let n = 0; n < targets.length; n++) {
    const t = targets[n]
    const body: Record<string, unknown> = {
      mode: "score_full",
      idempotency_key: `resymbol-${t.id}-${Date.now()}-${randomUUID().slice(0, 8)}`,
      is_practice: false,
    }
    if (t.kind === "practice") body.practice_item_id = t.id
    else { body.score_id = t.id; body.user_id = t.userId; body.storage_user_id = t.userId }

    try {
      const res = await fetch(`${relayUrl}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${relayKey}` },
        body: JSON.stringify(body),
      })
      if (res.ok) ok++
      else failures.push({ id: t.id, title: t.title, kind: t.kind, reason: `${res.status} ${(await res.text()).slice(0, 120)}` })
    } catch (e) {
      failures.push({ id: t.id, title: t.title, kind: t.kind, reason: String(e).slice(0, 120) })
    }

    if ((n + 1) % 25 === 0 || n === targets.length - 1) {
      console.log(`[${n + 1}/${targets.length}] ok=${ok} ng=${failures.length}`)
    }
    if (n < targets.length - 1) await sleep(SPACING_MS)
  }

  console.log(`\n=== 完了: 投入 ${ok} / 失敗 ${failures.length} ===`)
  for (const f of failures) console.log(`  NG [${f.kind}] ${f.title} (${f.id}) : ${f.reason}`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
