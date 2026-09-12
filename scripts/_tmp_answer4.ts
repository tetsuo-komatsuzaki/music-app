// 診断: ①認定曲が★ごとにどれだけ入っているか ②未検出を分母から外すと70%の線をまたぐか
// 読み取り専用。
import { config } from "dotenv"
config()

const TECH_COLUMNS: Record<string, string> = {
  slur: "techSlur", portato: "techPortato", staccato: "techStaccato", bow_staccato: "techBowStaccato",
  spiccato: "techSpiccato", ricochet: "techRicochet", pizzicato: "techPizzicato", tremolo: "techTremolo",
  vibrato: "techVibrato", trill: "techTrill", mordent: "techMordent", glissando: "techGlissando",
  harmonic: "techHarmonic",
}

type Row = { userId: string; notes: bigint; und: bigint; pmiss: bigint; smiss: bigint }

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")

  // ① 認定曲の登録状況
  const songs = await prisma.skillMasterySong.findMany({
    orderBy: [{ skillId: "asc" }, { star: "asc" }],
    select: { skillId: true, star: true, score: { select: { title: true, deletedAt: true } } },
  })
  console.log("── ① 認定曲の登録状況 ──")
  const bySkill = new Map<string, { star: number; title: string; dead: boolean }[]>()
  for (const s of songs) {
    const a = bySkill.get(s.skillId) ?? []
    a.push({ star: s.star, title: s.score.title, dead: s.score.deletedAt != null })
    bySkill.set(s.skillId, a)
  }
  for (const tech of Object.keys(TECH_COLUMNS)) {
    const rows = bySkill.get(tech)
    if (!rows) { console.log(`  ${tech.padEnd(14)} なし`); continue }
    const cells = [1, 2, 3, 4, 5].map((st) => {
      const r = rows.find((x) => x.star === st)
      return r ? `★${st}=${r.title.slice(0, 10)}${r.dead ? "(削除済)" : ""}` : `★${st}=—`
    })
    console.log(`  ${tech.padEnd(14)} ${cells.join("  ")}`)
  }
  console.log(`  合計 ${songs.length} 組`)

  // ② 70%の線をまたぐか (ユーザー×わざ)
  console.log("\n── ② 未検出を分母から外すと 70% の線をまたぐか ──")
  console.log("  わざ        ユーザー         対象音  検出  旧%   新%   旧ラベル    新ラベル")
  let flips = 0, total = 0
  for (const [tech, col] of Object.entries(TECH_COLUMNS)) {
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT x."userId" AS "userId",
             COUNT(*)::bigint AS notes,
             COUNT(*) FILTER (WHERE pn."evaluationStatus" = 'not_detected')::bigint AS und,
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
        AND np.${Prisma.raw(`"${col}"`)} = true
      GROUP BY 1`)

    for (const r of rows) {
      const n = Number(r.notes), und = Number(r.und), det = n - und
      const miss = Number(r.pmiss) + Number(r.smiss)
      const oldTarget = n * 2, oldMiss = und * 2 + miss
      const newTarget = det * 2, newMiss = miss
      if (oldTarget < 8) continue
      const oldPct = Math.max(0, Math.round(100 - (oldMiss / oldTarget) * 100))
      const newPct = newTarget >= 8 ? Math.max(0, Math.round(100 - (newMiss / newTarget) * 100)) : null
      const oldLab = oldPct < 70 ? "ゆらぎ中" : "安定"
      const newLab = newPct == null ? "データ少" : newPct < 70 ? "ゆらぎ中" : "安定"
      total++
      const flip = oldLab !== newLab
      if (flip) flips++
      console.log(
        `  ${tech.padEnd(11)} ${r.userId.slice(0, 12)}  ${String(n).padStart(5)} ${String(det).padStart(5)}` +
        `  ${String(oldPct).padStart(3)}  ${String(newPct ?? "-").padStart(4)}   ${oldLab.padEnd(9)} ${newLab}${flip ? "   ← 反転" : ""}`)
    }
  }
  console.log(`  => ${total} 件中 ${flips} 件が反転`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
