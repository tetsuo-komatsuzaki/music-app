// 通しの譜面をパート範囲で切った結果と、パート教材の生成譜面が一致するかを数で照合
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "../app/_libs/prisma"

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const MARKS = ["staccato", "spiccato", "strong-accent", "tenuto", "detached-legato", "tremolo"]

async function marksPerMeasure(path: string) {
  const { data, error } = await sb.storage.from("musicxml").download(path)
  if (error || !data) return null
  const s = Buffer.from(await data.arrayBuffer()).toString("utf8")
  const chunks = s.split(/<measure[^>]*number="[^"]+"/).slice(1)
  return chunks.map((c) => MARKS.reduce((n, m) => n + (c.split(`<${m}`).length - 1), 0))
}

async function main() {
  const parts = await prisma.practiceItem.findMany({
    where: { partId: { not: null } },
    select: { id: true, title: true, generatedXmlPath: true, variantRecipe: true, metadata: true, rhythmRecipe: true },
    orderBy: { title: "asc" },
  })
  const risky = (p: any) => !!p && ((p.skipHead ?? 0) > 0 || (p.skipTail ?? 0) > 0 || (p.skipMeasures ?? []).length > 0 || (p.unitMeasures ?? 1) > 1)
  const targets = parts.filter((p) => risky(((p.metadata as any) ?? {}).articulationPattern) || risky(p.rhythmRecipe as any))
  const cache = new Map<string, number[] | null>()
  let ok = 0, bad: string[] = [], skip = 0
  for (const p of targets) {
    const rec = p.variantRecipe as any
    const rule = (rec?.rules ?? []).find((r: any) => r.type === "measure_range")
    const srcId = rec?.sourceItemId
    if (!rule || !srcId || !p.generatedXmlPath) { skip++; continue }
    if (!cache.has(srcId)) {
      const src = await prisma.practiceItem.findUnique({ where: { id: srcId }, select: { generatedXmlPath: true } })
      cache.set(srcId, src?.generatedXmlPath ? await marksPerMeasure(src.generatedXmlPath) : null)
    }
    const full = cache.get(srcId)
    const mine = await marksPerMeasure(p.generatedXmlPath)
    if (!full || !mine) { skip++; continue }
    const expected = full.slice(rule.from - 1, rule.to)
    const same = expected.length === mine.length && expected.every((v, i) => v === mine[i])
    if (same) ok++
    else bad.push(`${p.title}\n    通しの${rule.from}-${rule.to}: [${expected.join(",")}]\n    パート教材   : [${mine.join(",")}]`)
  }
  console.log(`照合 ${targets.length}件: 一致 ${ok} / 不一致 ${bad.length} / 判定不能 ${skip}`)
  for (const b of bad.slice(0, 8)) console.log("  ✗", b)
  await prisma.$disconnect()
}
main().catch((e)=>{console.error(e);process.exit(1)})
