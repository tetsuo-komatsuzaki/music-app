// 診断: 演奏1本ごとの検出率の分布 (2026-09-09)。
// 「数字を出してよい録音」の線をどこに引くかを、勘ではなく分布から決めるため。
// 読み取り専用。
import { config } from "dotenv"
config()

type P = { pid: string; title: string; at: Date; notes: bigint; det: bigint; pmiss: bigint; smiss: bigint }

async function main() {
  const { prisma } = await import("../app/generated/prisma").then(async () => {
    return { prisma: (await import("../app/_libs/prisma")).prisma }
  })
  const { Prisma } = await import("../app/generated/prisma")

  for (const tech of ["techSlur", "techStaccato"]) {
    const rows = await prisma.$queryRaw<P[]>(Prisma.sql`
      SELECT x.id AS pid, o.title AS title, x."uploadedAt" AS at,
             COUNT(*)::bigint AS notes,
             COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected')::bigint AS det,
             COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."pitchOk" = false)::bigint AS pmiss,
             COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."startOk" = false)::bigint AS smiss
      FROM "PerformanceNote" pn
      JOIN "Performance" x ON x.id = pn."performanceId"
      JOIN "Score" o ON o.id = x."scoreId"
      JOIN "ScoreNote" sn ON sn."targetType"='score'::"ScoreNoteTarget"
        AND sn."targetId" = x."scoreId" AND sn."noteIndex" = pn."noteIndex"
      JOIN "NoteProfile" np ON np.id = sn."profileId"
      WHERE pn."performanceKind"='score'::"PerformanceKind"
        AND x."scoreNoteVersion" IS NOT NULL AND x."scoreNoteVersion" = o."scoreNoteVersion"
        AND np.${Prisma.raw(`"${tech}"`)} = true
      GROUP BY 1,2,3 ORDER BY 3`)

    console.log(`\n${"=".repeat(78)}\n${tech} ・ 演奏1本ごと (${rows.length}本)\n${"=".repeat(78)}`)
    if (rows.length === 0) { console.log("  なし"); continue }

    console.log("  日付        曲                 対象  検出  検出率   精度(検出のみ)")
    const rates: number[] = []
    for (const r of rows) {
      const n = Number(r.notes), d = Number(r.det)
      const rate = d / n
      rates.push(rate)
      const acc = d > 0 ? 100 - ((Number(r.pmiss) + Number(r.smiss)) / (d * 2)) * 100 : NaN
      console.log(
        `  ${r.at.toISOString().slice(0, 10)}  ${r.title.slice(0, 16).padEnd(17)}` +
        `${String(n).padStart(4)}  ${String(d).padStart(4)}  ${(rate * 100).toFixed(0).padStart(4)}%   ` +
        (d > 0 ? acc.toFixed(1).padStart(5) : "  -  "))
    }

    const sorted = [...rates].sort((a, b) => a - b)
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
    console.log(`  ─ 検出率の分布 ・ 最小${(sorted[0] * 100).toFixed(0)}% / 25%点${(q(.25) * 100).toFixed(0)}% ` +
      `/ 中央${(q(.5) * 100).toFixed(0)}% / 75%点${(q(.75) * 100).toFixed(0)}% / 最大${(sorted[sorted.length - 1] * 100).toFixed(0)}%`)

    // 候補となる線ごとに、何本が「数字を出せる」ことになるか
    console.log("  ─ 線を引いたときに数字を出せる演奏の本数")
    for (const [lab, minDet, minRate] of [
      ["検出3音以上 (FIRE_MIN_SAMPLES)", 3, 0],
      ["検出8音以上 (いまの target>=8 相当)", 8, 0],
      ["検出10音以上 (noteStore ホーム累計)", 10, 0],
      ["検出率50%以上 (DETECTION_RATE_MIN)", 0, 0.5],
      ["検出3音以上 かつ 検出率50%以上", 3, 0.5],
      ["検出10音以上 かつ 検出率50%以上", 10, 0.5],
    ] as [string, number, number][]) {
      const ok = rows.filter((r) => Number(r.det) >= minDet && Number(r.det) / Number(r.notes) >= minRate)
      console.log(`    ${lab.padEnd(38)} ${String(ok.length).padStart(2)} / ${rows.length} 本`)
    }
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
