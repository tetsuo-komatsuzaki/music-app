// 診断: B1 モックに載せる実データを集める (2026-09-09)。スラーを例にする。
// ①スラー音を最も多く持つユーザー ②その人の週ごとの精度 (検出できた音のみ)
// ③スラーの認定曲 ladder ④その人への先生の所見 ⑤検出率の推移
// 読み取り専用。
import { config } from "dotenv"
config()

type UserRow = { userId: string; notes: bigint; undetected: bigint }
type WeekRow = { wk: Date; notes: bigint; undetected: bigint; pmiss: bigint; smiss: bigint }

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")

  // ① スラー音を最も多く持つユーザー (曲の演奏のみ・版一致)
  const users = await prisma.$queryRaw<UserRow[]>(Prisma.sql`
    SELECT x."userId" AS "userId",
           COUNT(*)::bigint AS notes,
           COUNT(*) FILTER (WHERE pn."evaluationStatus" = 'not_detected')::bigint AS undetected
    FROM "PerformanceNote" pn
    JOIN "Performance" x ON x.id = pn."performanceId"
    JOIN "Score" o ON o.id = x."scoreId"
    JOIN "ScoreNote" sn ON sn."targetType"='score'::"ScoreNoteTarget"
      AND sn."targetId" = x."scoreId" AND sn."noteIndex" = pn."noteIndex"
    JOIN "NoteProfile" np ON np.id = sn."profileId"
    WHERE pn."performanceKind"='score'::"PerformanceKind"
      AND x."scoreNoteVersion" IS NOT NULL AND x."scoreNoteVersion" = o."scoreNoteVersion"
      AND np."techSlur" = true
    GROUP BY 1 ORDER BY 2 DESC LIMIT 5`)

  console.log("── ① スラー音の多いユーザー ──")
  for (const u of users) {
    const n = Number(u.notes), ud = Number(u.undetected)
    console.log(`  ${u.userId}  対象${n}音  未検出${ud}  (${((ud / n) * 100).toFixed(1)}%)`)
  }
  if (users.length === 0) { await prisma.$disconnect(); return }
  const target = users[0].userId

  // ② 週ごと (検出できた音のみで精度を出す)
  const weeks = await prisma.$queryRaw<WeekRow[]>(Prisma.sql`
    SELECT date_trunc('week', x."uploadedAt") AS wk,
           COUNT(*)::bigint AS notes,
           COUNT(*) FILTER (WHERE pn."evaluationStatus" = 'not_detected')::bigint AS undetected,
           COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."pitchOk" = false)::bigint AS pmiss,
           COUNT(*) FILTER (WHERE pn."evaluationStatus" <> 'not_detected' AND pn."startOk" = false)::bigint AS smiss
    FROM "PerformanceNote" pn
    JOIN "Performance" x ON x.id = pn."performanceId"
    JOIN "Score" o ON o.id = x."scoreId"
    JOIN "ScoreNote" sn ON sn."targetType"='score'::"ScoreNoteTarget"
      AND sn."targetId" = x."scoreId" AND sn."noteIndex" = pn."noteIndex"
    JOIN "NoteProfile" np ON np.id = sn."profileId"
    WHERE pn."performanceKind"='score'::"PerformanceKind"
      AND x."userId" = ${target}
      AND x."scoreNoteVersion" IS NOT NULL AND x."scoreNoteVersion" = o."scoreNoteVersion"
      AND np."techSlur" = true
    GROUP BY 1 ORDER BY 1`)

  console.log("\n── ② 週ごとの精度 (最多ユーザー) ──")
  for (const w of weeks) {
    const n = Number(w.notes), ud = Number(w.undetected)
    const det = n - ud
    const ex = det > 0 ? 100 - ((Number(w.pmiss) + Number(w.smiss)) / (det * 2)) * 100 : 0
    const now = 100 - ((ud * 2 + Number(w.pmiss) + Number(w.smiss)) / (n * 2)) * 100
    console.log(
      `  ${w.wk.toISOString().slice(0, 10)}  対象${String(n).padStart(4)}  検出${String(det).padStart(4)}` +
      `  検出率${((det / n) * 100).toFixed(0).padStart(3)}%  現行${Math.max(0, now).toFixed(1).padStart(5)}  除外${ex.toFixed(1).padStart(5)}`)
  }

  // ③ スラーの認定曲
  const ladder = await prisma.skillMasterySong.findMany({
    where: { skillId: "slur" }, orderBy: { star: "asc" },
    select: { star: true, scoreId: true, score: { select: { title: true } } },
  })
  console.log("\n── ③ スラーの認定曲 ──")
  for (const l of ladder) console.log(`  ★${l.star}  ${l.score.title}`)

  // その人の認定曲の平均点とマスター状況
  const ids = ladder.map((l) => l.scoreId)
  if (ids.length) {
    const perfs = await prisma.performance.findMany({
      where: { userId: target, scoreId: { in: ids }, pitchAccuracy: { not: null }, timingAccuracy: { not: null }, rangeFromNote: null },
      select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
    })
    const by = new Map<string, number[]>()
    for (const p of perfs) {
      const a = by.get(p.scoreId) ?? []
      a.push(((p.pitchAccuracy as number) + (p.timingAccuracy as number)) / 2)
      by.set(p.scoreId, a)
    }
    console.log("  ↓ 最多ユーザーの認定曲の成績")
    for (const l of ladder) {
      const a = by.get(l.scoreId)
      console.log(`    ★${l.star} ${l.score.title}: ` +
        (a ? `平均${(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1)}点 (${a.length}回)` : "録音なし"))
    }
  }

  // ④ 先生の所見 (スラー)
  const obs = await prisma.teacherObservation.findMany({
    where: { studentId: target, skillIds: { has: "slur" } },
    orderBy: { createdAt: "desc" }, take: 3,
    select: { createdAt: true, tagIds: true, severity: true, comment: true },
  })
  console.log("\n── ④ スラーの先生の所見 ──")
  if (obs.length === 0) console.log("  なし")
  for (const o of obs) console.log(`  ${o.createdAt.toISOString().slice(0, 10)} [${o.severity}] tags=${o.tagIds.join(",")} ${o.comment ?? ""}`)

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
