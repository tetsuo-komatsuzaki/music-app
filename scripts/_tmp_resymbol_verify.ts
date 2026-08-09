// v90 検証: 1件だけ再解析し、analysis.json に記号ガイド用の新フィールドが
// 出ているかを確認する (expressions / accidental / notehead / dots / voice / has_lyric)。
import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const relayUrl = process.env.RELAY_URL!
  const relayKey = process.env.RELAY_API_KEY!

  // 記号が多そうな教材を1件 (スラー付きの音階)
  const skip = Number(process.env.SKIP_N ?? 0)
  const items = await prisma.practiceItem.findMany({
    where: { buildStatus: "done", analysisStatus: "done" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    skip, take: 1,
  })
  const item = items[0]
  if (!item) throw new Error("対象の教材が見つかりません")
  console.log(`対象: ${item.title} (${item.id})`)

  if (process.env.SKIP_INVOKE) { await check(item.id); return }
  const res = await fetch(`${relayUrl}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${relayKey}` },
    body: JSON.stringify({
      mode: "score_full",
      idempotency_key: `resymbol-verify-${item.id}-${Date.now()}-${randomUUID().slice(0, 8)}`,
      practice_item_id: item.id,
      is_practice: false,
    }),
  })
  console.log(`invoke: ${res.status} ${await res.text()}`)

  // 完了待ち
  for (let i = 0; i < 60; i++) {
    await sleep(5000)
    const st = await prisma.practiceItem.findUnique({
      where: { id: item.id },
      select: { analysisStatus: true, buildStatus: true },
    })
    process.stdout.write(`\r  ${i * 5}s analysis=${st?.analysisStatus} build=${st?.buildStatus}   `)
    if (st?.analysisStatus === "done" && st?.buildStatus === "done") break
    if (st?.analysisStatus === "error" || st?.buildStatus === "error") throw new Error("解析エラー")
  }
  console.log("")

  await check(item.id)
}

async function check(itemId: string) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const path = `practice/${itemId}/analysis.json`
  const { data, error } = await sb.storage.from("musicxml").download(path)
  if (error) throw error
  const json = JSON.parse(await data.text())
  const notes: Record<string, unknown>[] = json.notes ?? []
  const first = notes.find((n) => n.type === "note") ?? {}
  const NEW = ["expressions", "accidental", "notehead", "dots", "voice", "has_lyric"]
  console.log("\n新フィールドの有無:")
  for (const k of NEW) console.log(`  ${k.padEnd(12)} ${k in first ? "○" : "×"}  例=${JSON.stringify(first[k])}`)
  const withAcc = notes.filter((n) => n.accidental).length
  const withDots = notes.filter((n) => (n.dots as number) > 0).length
  console.log(`\n臨時記号のある音符: ${withAcc} / 付点のある音符: ${withDots} / 全 ${notes.length}`)
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
