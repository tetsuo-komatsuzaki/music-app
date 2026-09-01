// 除外小節が効いていなかったパート教材の再解析 (2026-09-01 analyzer v120)
import "dotenv/config"
import { createRequire } from "module"
const require_ = createRequire(import.meta.url)
const M = require_("module") as { _load: (r: string, ...a: unknown[]) => unknown }
const orig = M._load
M._load = function (req: string, ...a: unknown[]) { if (req === "server-only") return {}; return orig.call(this, req, ...a) }

type Pat = { skipHead?: number; skipTail?: number; skipMeasures?: number[]; unitMeasures?: number }
const risky = (p: Pat | null | undefined) =>
  !!p && ((p.skipHead ?? 0) > 0 || (p.skipTail ?? 0) > 0 || (p.skipMeasures ?? []).length > 0 || (p.unitMeasures ?? 1) > 1)

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { invokeAnalysis } = await import("../app/_libs/pythonRunner")
  const rows = await prisma.practiceItem.findMany({
    where: { partId: { not: null } },
    select: { id: true, title: true, metadata: true, rhythmRecipe: true },
    orderBy: { title: "asc" },
  })
  const targets = rows.filter((r) => {
    const ap = ((r.metadata as Record<string, unknown>) ?? {}).articulationPattern as Pat | undefined
    return risky(ap) || risky(r.rhythmRecipe as Pat | null)
  })
  console.log(`対象 ${targets.length}件`)
  let ok = 0, ng = 0
  for (const [i, t] of targets.entries()) {
    try {
      await prisma.practiceItem.update({
        where: { id: t.id },
        data: { buildStatus: "queued", analysisStatus: "queued", errorMessage: null },
      })
      await invokeAnalysis({ mode: "score_full", idempotencyKey: `rebuild_v120:${t.id}`, practiceItemId: t.id })
      ok++
      console.log(`[${i + 1}/${targets.length}] 投入 ${t.title}`)
    } catch (e) {
      ng++
      console.log(`[${i + 1}/${targets.length}] 失敗 ${t.title}: ${e instanceof Error ? e.message : e}`)
    }
    await new Promise((r) => setTimeout(r, 4000))
  }
  console.log(`投入完了: 成功${ok} / 失敗${ng}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
