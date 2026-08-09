// バックフィルの成果を無作為サンプルで検証: 新フィールドの有無と、
// 実際に extractScoreSymbols が返す記号を数える。
import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import { extractScoreSymbols } from "@/app/_libs/scoreSymbols"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const NEW = ["expressions", "accidental", "notehead", "dots", "voice", "has_lyric"]

async function load(path: string) {
  const { data, error } = await sb.storage.from("musicxml").download(path)
  if (error) return null
  return JSON.parse(await data.text())
}

async function main() {
  const items = await prisma.practiceItem.findMany({
    where: { analysisStatus: "done" }, select: { id: true, title: true }, take: 400,
  })
  const scores = await prisma.score.findMany({
    where: { analysisStatus: "done", deletedAt: null }, select: { id: true, title: true, createdById: true }, take: 40,
  })
  const pick = <T,>(a: T[], n: number) => a.filter((_, i) => i % Math.max(1, Math.floor(a.length / n)) === 0).slice(0, n)

  let checked = 0, withNew = 0
  const symbolCount = new Map<string, number>()
  const rows: string[] = []

  for (const it of pick(items, 20)) {
    const j = await load(`practice/${it.id}/analysis.json`)
    if (!j) continue
    checked++
    const n0 = (j.notes ?? []).find((n: Record<string, unknown>) => n.type === "note") ?? {}
    if (NEW.every((k) => k in n0)) withNew++
    const { list } = extractScoreSymbols(j)
    for (const s of list) symbolCount.set(s.label, (symbolCount.get(s.label) ?? 0) + 1)
    rows.push(`  ${it.title.slice(0, 26).padEnd(28)} 記号${String(list.length).padStart(2)}種  ${list.slice(0, 6).map(s => s.label).join("・")}`)
  }
  for (const sc of pick(scores, 6)) {
    const j = await load(`${sc.createdById}/${sc.id}/analysis.json`)
    if (!j) continue
    checked++
    const n0 = (j.notes ?? []).find((n: Record<string, unknown>) => n.type === "note") ?? {}
    if (NEW.every((k) => k in n0)) withNew++
    const { list } = extractScoreSymbols(j)
    for (const s of list) symbolCount.set(s.label, (symbolCount.get(s.label) ?? 0) + 1)
    rows.push(`  [曲] ${sc.title.slice(0, 22).padEnd(24)} 記号${String(list.length).padStart(2)}種  ${list.slice(0, 6).map(s => s.label).join("・")}`)
  }

  console.log(rows.join("\n"))
  console.log(`\n新フィールドあり: ${withNew} / ${checked} 件`)
  console.log(`\n出現した記号 (${symbolCount.size}種):`)
  console.log([...symbolCount.entries()].sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k} × ${v}`).join("\n"))
}
main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
