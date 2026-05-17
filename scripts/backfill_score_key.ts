// scripts/backfill_score_key.ts
//
// v1.6 Phase 4-4 critical-path fix (Q3=b 確定):
// 既存 Score の keyTonic/keyMode が全件 null。
// analyze_musicxml.py は既に MusicXML から key を抽出し analysis.json に
// 書き込み済 ({createdById}/{scoreId}/analysis.json の "key": {tonic, mode})。
// その値を読み出して Score テーブルに backfill する。
//
// 正規化: music21 形式 ('B-') → Arcoda 標準 ('Bb') へ ('-' を 'b' 置換)。
//   analyze_musicxml.py の normalize_tonic と同一ロジック。
//
// 対象: keyTonic OR keyMode が null の Score (deletedAt=null)。
//   --apply を付けない限り dry-run (UPDATE せず差分だけ表示)。
//
// 実行:
//   dry-run : npx tsx scripts/backfill_score_key.ts
//   適用    : npx tsx scripts/backfill_score_key.ts --apply

import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { storageAdmin } from "@/app/_libs/storageAdmin"

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")
const MUSICXML_BUCKET = process.env.BUCKET_NAME ?? "musicxml"

function normalizeTonic(name: string): string {
  if (!name) return name
  return name.replace(/-/g, "b")
}

async function fetchAnalysisKey(
  createdById: string,
  scoreId: string,
): Promise<{
  tonic: string
  mode: string
  bpm: number | null
  timeNum: number | null
  timeDen: number | null
} | null> {
  const path = `${createdById}/${scoreId}/analysis.json`
  const signed = await storageAdmin.storage
    .from(MUSICXML_BUCKET)
    .createSignedUrl(path, 120)
    .then((r) => r.data?.signedUrl ?? null)
    .catch(() => null)
  if (!signed) return null
  try {
    const res = await fetch(signed)
    if (!res.ok) return null
    const json = (await res.json()) as {
      key?: { tonic?: string; mode?: string }
      bpm?: number
      time_signature?: { numerator?: number; denominator?: number }
    }
    const tonic = json.key?.tonic
    const mode = json.key?.mode
    if (typeof tonic !== "string" || typeof mode !== "string") return null
    // G2: analysis.json の bpm → Score.defaultTempo (Int) へ
    const bpm = typeof json.bpm === "number" ? Math.round(json.bpm) : null
    // G4: analysis.json の time_signature → Score.timeNumerator/timeDenominator へ
    const timeNum =
      typeof json.time_signature?.numerator === "number"
        ? json.time_signature.numerator
        : null
    const timeDen =
      typeof json.time_signature?.denominator === "number"
        ? json.time_signature.denominator
        : null
    return { tonic, mode, bpm, timeNum, timeDen }
  } catch {
    return null
  }
}

async function main() {
  console.log(`=== Score key/defaultTempo/timeSignature backfill (${APPLY ? "APPLY" : "DRY-RUN"}) ===\n`)

  // G1(key) 済 / G2(defaultTempo) 済だが G4(timeNumerator/Denominator) 全件 null のため
  // いずれか null を対象に含める (既存値は温存、null のみ埋める)。
  const targets = await prisma.score.findMany({
    where: {
      deletedAt: null,
      OR: [
        { keyTonic: null },
        { keyMode: null },
        { defaultTempo: null },
        { timeNumerator: null },
        { timeDenominator: null },
      ],
    },
    select: {
      id: true, title: true, createdById: true,
      keyTonic: true, keyMode: true, defaultTempo: true,
      timeNumerator: true, timeDenominator: true,
    },
  })

  console.log(`対象 Score (key/tempo/timeSig いずれか null): ${targets.length} 件\n`)

  let resolved = 0
  let skipped = 0
  for (const s of targets) {
    const meta = await fetchAnalysisKey(s.createdById, s.id)
    if (!meta) {
      console.log(`  ⏭  SKIP  「${s.title}」 (${s.id}) — analysis.json or key 取得失敗`)
      skipped += 1
      continue
    }
    const normTonic = normalizeTonic(meta.tonic)
    // 既に値があるものは温存、null のみ埋める
    const data: {
      keyTonic?: string
      keyMode?: string
      defaultTempo?: number
      timeNumerator?: number
      timeDenominator?: number
    } = {}
    if (s.keyTonic == null) data.keyTonic = normTonic
    if (s.keyMode == null) data.keyMode = meta.mode
    if (s.defaultTempo == null && meta.bpm != null) data.defaultTempo = meta.bpm
    if (s.timeNumerator == null && meta.timeNum != null) data.timeNumerator = meta.timeNum
    if (s.timeDenominator == null && meta.timeDen != null) data.timeDenominator = meta.timeDen
    console.log(
      `  ✅ ${APPLY ? "UPDATE" : "would update"}  「${s.title}」 (${s.id})  ` +
        `→ ${JSON.stringify(data)}  (raw tonic=${meta.tonic} bpm=${meta.bpm})`,
    )
    if (APPLY && Object.keys(data).length > 0) {
      await prisma.score.update({ where: { id: s.id }, data })
    }
    resolved += 1
  }

  console.log(
    `\n=== 完了: ${resolved} 件 ${APPLY ? "更新" : "更新予定"} / ${skipped} 件 skip ===`,
  )
  if (!APPLY && resolved > 0) {
    console.log("反映するには再実行: npx tsx scripts/backfill_score_key.ts --apply")
  }
}

main()
  .catch((e) => {
    console.error("[ERROR]", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
