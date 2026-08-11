// 教材の「含まれる音の移動」を metadata.transitionKeys にバックフィル (2026-08-11)。
// analysis.json (musicxml バケット) の notes 配列から隣接する単音ペア "C4>D4" を抽出。
// 休符で遷移を切る (analyze_performance.py noteStats.transitions と同じ規則)。重音("/"入り)は不参加。
// 既定は dry-run。--apply で書き込み。対象=公開中・共有・解析done の全教材 (②fingering と ④etude/double_stop の両方で使う)。
// 新規教材の自動付与は未対応 (analyze_musicxml.py 側への追記が残タスク) — 教材追加後は本スクリプトを再実行する。
import { config } from "dotenv"
config()
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const APPLY = process.argv.includes("--apply")

type AnalysisNote = { type?: string; note_name?: string | null }

function extractTransitionKeys(notes: AnalysisNote[]): string[] {
  const keys = new Set<string>()
  let prev: string | null = null
  for (const n of notes) {
    if (n.type === "rest") { prev = null; continue }
    if (n.type !== "note") continue
    const name = n.note_name
    if (!name || name.includes("/")) { prev = null; continue } // 重音は遷移に参加しない
    if (prev) keys.add(`${prev}>${name}`)
    prev = name
  }
  return [...keys].sort()
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })
  const { createClient } = await import("@supabase/supabase-js")
  const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const items = await prisma.practiceItem.findMany({
    where: { isPublished: true, ownerUserId: null, analysisStatus: "done", analysisPath: { not: null } },
    select: { id: true, title: true, category: true, analysisPath: true, metadata: true },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  })
  console.log(`対象教材: ${items.length}件 (${APPLY ? "APPLY" : "dry-run"})`)

  let ok = 0, skip = 0, fail = 0
  for (const item of items) {
    try {
      const dl = await storage.storage.from("musicxml").download(item.analysisPath!)
      if (dl.error || !dl.data) { console.log(`  FAIL(dl) ${item.title}`); fail++; continue }
      const json = JSON.parse(await dl.data.text()) as { notes?: AnalysisNote[] }
      const notes = json.notes
      if (!Array.isArray(notes)) { console.log(`  SKIP(no notes) ${item.title}`); skip++; continue }
      const keys = extractTransitionKeys(notes)
      const prevMeta = (item.metadata ?? {}) as Record<string, unknown>
      console.log(`  ${item.category} | ${item.title} → ${keys.length}遷移 (例: ${keys.slice(0, 3).join(", ") || "-"})`)
      if (APPLY) {
        await prisma.practiceItem.update({
          where: { id: item.id },
          data: { metadata: { ...prevMeta, transitionKeys: keys } },
        })
      }
      ok++
    } catch (e) {
      console.log(`  FAIL ${item.title}: ${e instanceof Error ? e.message : e}`)
      fail++
    }
  }
  console.log(`done: ok=${ok} skip=${skip} fail=${fail}${APPLY ? "" : " (書き込みなし。--apply で反映)"}`)
  await prisma.$disconnect()
}
main()
