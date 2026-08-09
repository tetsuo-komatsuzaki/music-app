import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { randomUUID } from "node:crypto"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const relayUrl = process.env.RELAY_URL!
  const relayKey = process.env.RELAY_API_KEY!
  const perf = await prisma.performance.findUnique({
    where: { id: "cmplsqe3i000004i61gisxyp5" },
    select: { userId: true, scoreId: true },
  })
  const idem = `reanalyze-${perf!.scoreId}-${Date.now()}-${randomUUID().slice(0, 8)}`
  const res = await fetch(`${relayUrl}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${relayKey}` },
    body: JSON.stringify({
      mode: "analyze_performance",
      idempotency_key: idem,
      user_id: perf!.userId,
      score_id: perf!.scoreId,
      performance_id: "cmplsqe3i000004i61gisxyp5",
      is_practice: false,
    }),
  })
  console.log(`status: ${res.status}, body: ${await res.text()}`)
}
main().finally(() => prisma.$disconnect())
