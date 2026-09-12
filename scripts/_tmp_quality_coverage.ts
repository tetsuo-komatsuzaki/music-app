// 診断: 奏法品質の判定に要る測定値が、DBに何%入っているか (2026-09-12)。
// 入っていれば、解析器に触らず画面側だけで奏法の合否を出せる。
// 読み取り専用。
import { config } from "dotenv"
config()

// 奏法 → 判定に要る列 (music-analyzer/lib/subtask_judges.py と対応)
const NEED: Record<string, { col: string; fields: string[] }> = {
  staccato: { col: "techStaccato", fields: ["durRatio"] },
  spiccato: { col: "techSpiccato", fields: ["durRatio"] },
  portato: { col: "techPortato", fields: ["durRatio"] },
  trill: { col: "techTrill", fields: ["pitchAltCount", "pitchAltSemitones"] },
  pizzicato: { col: "techPizzicato", fields: ["attackPeakFrac", "decayRatio"] },
  glissando: { col: "techGlissando", fields: ["glissRangeSemitones", "glissMonotonicFrac"] },
  tremolo: { col: "techTremolo", fields: ["pitchAltCount", "ampStrokeCount"] },
  // 判定が無い奏法。スラーは attackPeakFrac で新しく作れるかを見る
  slur: { col: "techSlur", fields: ["attackPeakFrac", "durRatio"] },
  vibrato: { col: "techVibrato", fields: ["pitchAltCount", "durRatio"] },
  bow_staccato: { col: "techBowStaccato", fields: ["durRatio"] },
  ricochet: { col: "techRicochet", fields: ["durRatio"] },
  harmonic: { col: "techHarmonic", fields: ["durRatio"] },
  mordent: { col: "techMordent", fields: ["pitchAltCount"] },
}

type Row = { notes: bigint; evaluated: bigint } & Record<string, bigint>

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")

  console.log("わざ          対象音  判定済  " + "測定値が入っている割合")
  console.log("=".repeat(78))
  for (const [tech, { col, fields }] of Object.entries(NEED)) {
    const sel = fields
      .map((f) => `COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."${f}" IS NOT NULL)::bigint AS "${f}"`)
      .join(",\n             ")
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS notes,
             COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected')::bigint AS evaluated,
             ${Prisma.raw(sel)}
      FROM "PerformanceNote" pn
      JOIN "ScoreNote" sn ON sn."targetType" = (CASE WHEN pn."performanceKind"='score'::"PerformanceKind"
                                                     THEN 'score'::"ScoreNoteTarget" ELSE 'practice'::"ScoreNoteTarget" END)
        AND sn."noteIndex" = pn."noteIndex"
        AND sn."targetId" = (CASE WHEN pn."performanceKind"='score'::"PerformanceKind"
                                  THEN (SELECT p."scoreId" FROM "Performance" p WHERE p.id = pn."performanceId")
                                  ELSE (SELECT q."practiceItemId" FROM "PracticePerformance" q WHERE q.id = pn."performanceId") END)
      JOIN "NoteProfile" np ON np.id = sn."profileId"
      WHERE np.${Prisma.raw(`"${col}"`)} = true`)
    const r = rows[0]
    const n = Number(r.notes), ev = Number(r.evaluated)
    if (n === 0) { console.log(`${tech.padEnd(14)} ${String(n).padStart(5)}  ${String(ev).padStart(5)}  対象音なし`); continue }
    const parts = fields.map((f) => {
      const v = Number(r[f] as unknown as bigint)
      return `${f}=${v}/${ev} (${ev ? ((v / ev) * 100).toFixed(0) : "-"}%)`
    })
    console.log(`${tech.padEnd(14)} ${String(n).padStart(5)}  ${String(ev).padStart(5)}  ${parts.join("  ")}`)
  }
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
