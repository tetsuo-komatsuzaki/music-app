import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const IDS = [
  "cmrt77mox000h04l4pa97xvt4", // 検証で retry を使い切った
  "cmrt77ohh000l04l45flwmqhd", // 同上
]

async function main() {
  const relayUrl = process.env.RELAY_URL!, relayKey = process.env.RELAY_API_KEY!
  // 検証で回数を使い切っているのでカウンタを戻す
  await prisma.practiceItem.updateMany({ where: { id: { in: IDS } }, data: { retryCount: 0 } })
  const err = await prisma.practiceItem.findMany({
    where: { analysisStatus: "error" }, select: { id: true, title: true },
  })
  console.log("error 状態の教材:", err.map(e => `${e.title}(${e.id})`).join(", ") || "なし")
  const targets = Array.from(new Set([...IDS, ...err.map(e => e.id)]))

  for (const id of targets) {
    const r = await fetch(`${relayUrl}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${relayKey}` },
      body: JSON.stringify({
        mode: "score_full",
        idempotency_key: `resymbol-retry-${id}-${Date.now()}-${randomUUID().slice(0, 8)}`,
        practice_item_id: id, is_practice: false,
      }),
    })
    console.log(`${id}: ${r.status} ${(await r.text()).slice(0, 100)}`)
    await sleep(3000)
  }

  // 完了待ち
  for (let i = 0; i < 40; i++) {
    await sleep(5000)
    const rows = await prisma.practiceItem.findMany({
      where: { id: { in: targets } }, select: { id: true, title: true, analysisStatus: true },
    })
    const pending = rows.filter(r => r.analysisStatus !== "done")
    process.stdout.write(`\r  ${i * 5}s 残り ${pending.length}   `)
    if (pending.length === 0) break
    if (pending.some(r => r.analysisStatus === "error")) {
      console.log("\n  error:", pending.filter(r => r.analysisStatus === "error").map(r => r.title).join(", "))
      break
    }
  }
  console.log("")
  const fin = await prisma.practiceItem.findMany({
    where: { id: { in: targets } }, select: { title: true, analysisStatus: true },
  })
  for (const f of fin) console.log(`  ${f.analysisStatus === "done" ? "○" : "×"} ${f.title} (${f.analysisStatus})`)
}
main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
