// 診断: わざの詳細の「精度 11%」の内訳を実データで割る (2026-09-09)。
// 知りたいこと: ミスの正体が「外した音」なのか「検出できなかった音」なのか。
//   現行式  = 100 - miss/target*100 ・ target = 音数x2 (pitch/rhythm 両方を計上)
//            not_detected は pitch/rhythm 両方のミスに数えられる (noteStoreSummary.perSubtaskOf)
//   除外式  = not_detected を分母から外した場合の精度 (subtask_judges._bow_evaluable と同じ扱い)
// 読み取り専用。
import { config } from "dotenv"
config()

const TECH_COLUMNS: Record<string, string> = {
  slur: "techSlur", portato: "techPortato", staccato: "techStaccato", bow_staccato: "techBowStaccato",
  spiccato: "techSpiccato", ricochet: "techRicochet", pizzicato: "techPizzicato", tremolo: "techTremolo",
  vibrato: "techVibrato", trill: "techTrill", mordent: "techMordent", glissando: "techGlissando",
  harmonic: "techHarmonic",
}

type Row = {
  notes: bigint          // 対象音符の総数
  undetected: bigint     // evaluationStatus = not_detected
  pitch_miss: bigint     // 検出できた音のうち音程NG
  start_miss: bigint     // 検出できた音のうちタイミングNG
}

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")

  const pad = (s: string, n: number) => s + " ".repeat(Math.max(0, n - s.length))
  const pct = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : "-")

  console.log("わざ別 ・ 検出できなかった音の割合と、精度の2つの出し方の差")
  console.log("=".repeat(104))
  console.log(
    pad("わざ", 18) + pad("対象音", 9) + pad("未検出", 9) + pad("未検出率", 10) +
    pad("音程NG", 9) + pad("リズムNG", 10) + pad("現行式", 9) + pad("除外式", 9) + "差",
  )
  console.log("-".repeat(104))

  for (const [tech, col] of Object.entries(TECH_COLUMNS)) {
    const agg = { notes: 0, undetected: 0, pitch_miss: 0, start_miss: 0 }

    // 曲と教材の両系統。版ずれ (scoreNoteVersion 不一致) の演奏は noteStore と同じく除く
    for (const kind of ["score", "practice"] as const) {
      const perfTable = kind === "score" ? Prisma.raw('"Performance"') : Prisma.raw('"PracticePerformance"')
      const targetCol = kind === "score" ? Prisma.raw('"scoreId"') : Prisma.raw('"practiceItemId"')
      const ownerTable = kind === "score" ? Prisma.raw('"Score"') : Prisma.raw('"PracticeItem"')

      const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
        SELECT
          COUNT(*)::bigint AS notes,
          COUNT(*) FILTER (WHERE pn."evaluationStatus" = 'not_detected')::bigint AS undetected,
          COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."pitchOk" = false)::bigint AS pitch_miss,
          COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."startOk" = false)::bigint AS start_miss
        FROM "PerformanceNote" pn
        JOIN ${perfTable} x ON x.id = pn."performanceId"
        JOIN ${ownerTable} o ON o.id = x.${targetCol}
        JOIN "ScoreNote" sn
          ON sn."targetType" = ${kind}::"ScoreNoteTarget"
         AND sn."targetId" = x.${targetCol}
         AND sn."noteIndex" = pn."noteIndex"
        JOIN "NoteProfile" np ON np.id = sn."profileId"
        WHERE pn."performanceKind" = ${kind}::"PerformanceKind"
          AND x."scoreNoteVersion" IS NOT NULL
          AND x."scoreNoteVersion" = o."scoreNoteVersion"
          AND np.${Prisma.raw(`"${col}"`)} = true`)

      const r = rows[0]
      if (!r) continue
      agg.notes += Number(r.notes)
      agg.undetected += Number(r.undetected)
      agg.pitch_miss += Number(r.pitch_miss)
      agg.start_miss += Number(r.start_miss)
    }

    if (agg.notes === 0) {
      console.log(pad(tech, 18) + "対象音なし")
      continue
    }

    // 現行式: target = 音数x2 ・ 未検出は2件ぶんミス
    const targetNow = agg.notes * 2
    const missNow = agg.undetected * 2 + agg.pitch_miss + agg.start_miss
    const pctNow = Math.max(0, 100 - (missNow / targetNow) * 100)

    // 除外式: 未検出を分母から外す
    const detected = agg.notes - agg.undetected
    const targetEx = detected * 2
    const missEx = agg.pitch_miss + agg.start_miss
    const pctEx = targetEx > 0 ? Math.max(0, 100 - (missEx / targetEx) * 100) : 0

    console.log(
      pad(tech, 18) +
      pad(String(agg.notes), 9) +
      pad(String(agg.undetected), 9) +
      pad(pct(agg.undetected, agg.notes) + "%", 10) +
      pad(String(agg.pitch_miss), 9) +
      pad(String(agg.start_miss), 10) +
      pad(pctNow.toFixed(1), 9) +
      pad(pctEx.toFixed(1), 9) +
      (targetEx > 0 ? "+" + (pctEx - pctNow).toFixed(1) : "-"),
    )
  }

  console.log("=".repeat(104))
  console.log("現行式 = いまアプリが表示している精度 ・ 除外式 = 検出できた音だけで出した精度")
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
