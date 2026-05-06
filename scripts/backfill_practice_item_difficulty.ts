// scripts/backfill_practice_item_difficulty.ts
//
// v3.2.2 Commit 1.5 — PracticeItem.difficulty backfill
//
// Usage:
//   npx tsx scripts/backfill_practice_item_difficulty.ts --dry-run
//   npx tsx scripts/backfill_practice_item_difficulty.ts --sample 5
//   npx tsx scripts/backfill_practice_item_difficulty.ts --apply
//
// データソース：
//   - scale (171): seed-practice-items.ts と同じ公式で title + keyMode から算出 (1-5)
//   - arpeggio (81): arcoda_arpeggios_540.xlsx の J 列 を tonic + chordType + octaves で照合 (1-5)
//   - etude (21): NULL 温存 (spec ガードレール、admin 個別対応)
//
// 1-5 → 1-10 拡張: ×2 (1→2 / 2→4 / 3→6 / 4→8 / 5→10)
// 設計書 §10 GRADE_DIFFICULTY_RANGE が 1-10 前提のため、Excel の 1-5 を線形拡張する。

import { config } from "dotenv"
config()

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import * as XLSX from "xlsx"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ARPEGGIO_XLSX = path.join(__dirname, "..", "prisma", "data", "arcoda_arpeggios_540.xlsx")

// metadata.chordType (DB) → Excel G列 chordKey
const CHORD_TYPE_TO_KEY: Record<string, string> = {
  major_triad: "major",
  minor_triad: "minor",
  augmented: "augmented",
  dominant7: "dominant7",
  diminished7: "diminished7",
}

// =========================================================
// scale 用: title + keyMode から difficulty 算出
// seed-practice-items.ts L78-80 と同じロジック
//   difficulty = octaves
//   + 1 if minor / chromatic
//   + 1 if high / full register
//   max 5
// =========================================================
function deriveScaleDifficulty(title: string, keyMode: string): number | null {
  // title 例: "A(2オクターブ・高)" "C(3オクターブ・全)" "Bb(1オクターブ・低)"
  const m = title.match(/\((\d+)オクターブ・(.+?)\)/)
  if (!m) return null
  const octaves = parseInt(m[1])
  const register = m[2] // "高" / "低" / "全"

  let d = octaves
  if (keyMode === "minor" || keyMode === "chromatic") d += 1
  if (register === "高" || register === "全") d += 1
  return Math.min(d, 5)
}

// =========================================================
// arpeggio 用: Excel から (tonic, chordKey, octaves, bowKey="detache") をキーに難易度引く
// =========================================================
function buildArpeggioDifficultyMap(): Map<string, number> {
  const wb = XLSX.readFile(ARPEGGIO_XLSX)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  const m = new Map<string, number>()

  // 行構造: row[3]=tonic, row[6]=chordKey, row[7]=octaves, row[8]=bowJa, row[9]=difficulty
  // bowJa "デタシェ" のみを採用 (DB 側 detache 限定 seed と整合)
  for (const row of rows.slice(1)) {
    if (!row[0]) continue
    const tonic = String(row[3] || "").trim()
    const chordKey = String(row[6] || "").trim()
    const octaves = parseInt(String(row[7] || "0"))
    const bowJa = String(row[8] || "").trim()
    const diff = parseInt(String(row[9] || ""))
    if (bowJa !== "デタシェ") continue
    if (!tonic || !chordKey || !octaves || !diff) continue
    // octaves は MIN_OCTAVES 制約で seed 時点で押し上げられているので max(excel, MIN_OCTAVES[chordKey]) で照合する
    // ここでは Excel 側の (tonic, chordKey, raw octaves) をキーにし、DB 側の照合では DB octaves と最近一致を取る
    const key = `${tonic}|${chordKey}|${octaves}`
    m.set(key, diff)
  }
  return m
}

// title 例: "F#(3オクターブ・属7和音)" "Bb(2オクターブ・長和音)" → octaves
function parseArpeggioOctaves(title: string): number | null {
  const m = title.match(/\((\d+)オクターブ/)
  if (!m) return null
  return parseInt(m[1])
}

// arpeggio difficulty を引く: DB の (tonic, chordType, octaves) → Excel の (tonic, chordKey, octaves)
// MIN_OCTAVES (major/minor=3, augmented=3, dominant7=2, diminished7=2) で seed 時に押し上げられている
// 場合があるので、DB octaves 以下の Excel 行のうち最大の難易度を採用 (= 「(N オクターブ以下を全部弾けるレベル) の最大」)
// → ただし通常は DB octaves と Excel octaves は一致するので simple 一致を優先
function lookupArpeggioDifficulty(
  map: Map<string, number>,
  tonic: string,
  chordType: string,
  octaves: number,
): { difficulty: number | null; key: string } {
  const chordKey = CHORD_TYPE_TO_KEY[chordType]
  if (!chordKey) return { difficulty: null, key: `${tonic}|?(${chordType})|${octaves}` }

  // 1. 完全一致を試す
  const exactKey = `${tonic}|${chordKey}|${octaves}`
  if (map.has(exactKey)) return { difficulty: map.get(exactKey)!, key: exactKey }

  // 2. fallback: 同じ tonic+chordKey で最大 octaves を探す
  let best = -1
  let bestKey = ""
  for (const [k, v] of map.entries()) {
    if (k.startsWith(`${tonic}|${chordKey}|`) && v > best) {
      best = v
      bestKey = k
    }
  }
  if (best > 0) return { difficulty: best, key: `${bestKey} (fallback for octaves=${octaves})` }
  return { difficulty: null, key: exactKey }
}

// =========================================================
// メイン
// =========================================================
type Mode = "dry-run" | "sample" | "apply"

interface BackfillItem {
  id: string
  category: string
  title: string
  keyMode: string
  metadata: any
  excelOrFormulaDifficulty: number | null
  finalDifficulty: number | null
  source: string
  note: string
}

async function plan(prisma: PrismaClient): Promise<BackfillItem[]> {
  const arpMap = buildArpeggioDifficultyMap()
  const items = await prisma.practiceItem.findMany({
    select: { id: true, category: true, title: true, keyTonic: true, keyMode: true, metadata: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  })
  const out: BackfillItem[] = []
  for (const it of items) {
    if (it.category === "scale") {
      const d = deriveScaleDifficulty(it.title, it.keyMode)
      out.push({
        id: it.id,
        category: it.category,
        title: it.title,
        keyMode: it.keyMode,
        metadata: it.metadata,
        excelOrFormulaDifficulty: d,
        finalDifficulty: d != null ? d * 2 : null,
        source: "scale-formula",
        note: d == null ? "title parse failed" : "",
      })
    } else if (it.category === "arpeggio") {
      const meta = (it.metadata ?? {}) as Record<string, any>
      const chordType = String(meta.chordType ?? "")
      const oct = parseArpeggioOctaves(it.title)
      if (!oct || !chordType) {
        out.push({
          id: it.id,
          category: it.category,
          title: it.title,
          keyMode: it.keyMode,
          metadata: it.metadata,
          excelOrFormulaDifficulty: null,
          finalDifficulty: null,
          source: "arpeggio-excel",
          note: !oct ? "title octaves parse failed" : "metadata.chordType missing",
        })
        continue
      }
      const r = lookupArpeggioDifficulty(arpMap, it.keyTonic, chordType, oct)
      out.push({
        id: it.id,
        category: it.category,
        title: it.title,
        keyMode: it.keyMode,
        metadata: it.metadata,
        excelOrFormulaDifficulty: r.difficulty,
        finalDifficulty: r.difficulty != null ? r.difficulty * 2 : null,
        source: "arpeggio-excel",
        note: r.key,
      })
    } else if (it.category === "etude") {
      out.push({
        id: it.id,
        category: it.category,
        title: it.title,
        keyMode: it.keyMode,
        metadata: it.metadata,
        excelOrFormulaDifficulty: null,
        finalDifficulty: null,
        source: "etude-skip",
        note: "left NULL (admin 個別対応)",
      })
    }
  }
  return out
}

function summarize(plan: BackfillItem[]) {
  const byCat: Record<string, { total: number; willFill: number; willSkip: number; dist: Record<number, number> }> = {}
  for (const p of plan) {
    if (!byCat[p.category]) byCat[p.category] = { total: 0, willFill: 0, willSkip: 0, dist: {} }
    byCat[p.category].total++
    if (p.finalDifficulty != null) {
      byCat[p.category].willFill++
      byCat[p.category].dist[p.finalDifficulty] = (byCat[p.category].dist[p.finalDifficulty] || 0) + 1
    } else {
      byCat[p.category].willSkip++
    }
  }
  console.log("\n=== Summary ===")
  for (const [cat, s] of Object.entries(byCat)) {
    console.log(`${cat}: total=${s.total}, will fill=${s.willFill}, will skip=${s.willSkip}`)
    const dist = Object.keys(s.dist).sort((a, b) => +a - +b).map(k => `${k}:${s.dist[+k]}`).join(", ")
    if (dist) console.log(`  difficulty distribution (DB 1-10): ${dist}`)
  }
  const failed = plan.filter(p => p.finalDifficulty == null && p.source !== "etude-skip")
  if (failed.length) {
    console.log(`\n!! ${failed.length} items failed to derive difficulty (excluding etudes):`)
    for (const f of failed.slice(0, 10)) {
      console.log(`  [${f.category}] ${f.id} "${f.title}" — ${f.note}`)
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  let mode: Mode = "dry-run"
  let sampleN = 5
  if (args.includes("--apply")) mode = "apply"
  else if (args.includes("--sample")) {
    mode = "sample"
    const idx = args.indexOf("--sample")
    if (idx >= 0 && args[idx + 1]) sampleN = parseInt(args[idx + 1])
  }
  console.log(`mode: ${mode}${mode === "sample" ? ` (n=${sampleN})` : ""}`)

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const planResult = await plan(prisma)
  summarize(planResult)

  if (mode === "dry-run") {
    console.log("\n=== Sample (head 10) ===")
    for (const p of planResult.slice(0, 10)) {
      console.log(`[${p.category}] ${p.id} "${p.title}" mode=${p.keyMode} excel/formula=${p.excelOrFormulaDifficulty} → DB=${p.finalDifficulty} (${p.note})`)
    }
    console.log("\n(no changes written. Run with --sample N or --apply.)")
  } else if (mode === "sample") {
    const fillable = planResult.filter(p => p.finalDifficulty != null).slice(0, sampleN)
    console.log(`\n=== Updating ${fillable.length} sample items ===`)
    for (const p of fillable) {
      await prisma.practiceItem.update({
        where: { id: p.id },
        data: { difficulty: p.finalDifficulty! },
      })
      console.log(`  [${p.category}] ${p.id} "${p.title}" → difficulty=${p.finalDifficulty}`)
    }
    console.log("\nSample apply done. Verify, then run --apply for full.")
  } else if (mode === "apply") {
    const fillable = planResult.filter(p => p.finalDifficulty != null)
    console.log(`\n=== Updating ${fillable.length} items (etude ${planResult.length - fillable.length} skipped) ===`)
    let n = 0
    for (const p of fillable) {
      await prisma.practiceItem.update({
        where: { id: p.id },
        data: { difficulty: p.finalDifficulty! },
      })
      n++
      if (n % 50 === 0) console.log(`  updated ${n}...`)
    }
    console.log(`\nDone: ${n} items updated.`)
    // verify
    const remainingNull = await prisma.practiceItem.count({ where: { difficulty: null } })
    const total = await prisma.practiceItem.count()
    console.log(`After: ${total - remainingNull}/${total} items have difficulty (${remainingNull} NULL — should be 21 etudes).`)
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
