// 診断: 測定値が空で、音声が残っていて、品質判定の対象奏法を含む演奏を探す。読み取り専用。
import { config } from "dotenv"
config()
type R = { id: string; at: Date; title: string; scoreId: string; owner: string; userId: string
           notes: bigint; withDur: bigint; stac: bigint; audio: string }
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  const { Prisma } = await import("../app/generated/prisma")
  const rows = await prisma.$queryRaw<R[]>(Prisma.sql`
    SELECT x.id, x."uploadedAt" AS at, o.title, x."scoreId" AS "scoreId",
           o."createdById" AS owner, x."userId" AS "userId", x."audioPath" AS audio,
           COUNT(*)::bigint AS notes,
           COUNT(*) FILTER (WHERE pn."durRatio" IS NOT NULL)::bigint AS "withDur",
           COUNT(*) FILTER (WHERE np."techStaccato" OR np."techSpiccato" OR np."techPortato"
                              OR np."techTrill" OR np."techPizzicato")::bigint AS stac
    FROM "PerformanceNote" pn
    JOIN "Performance" x ON x.id = pn."performanceId"
    JOIN "Score" o ON o.id = x."scoreId"
    JOIN "ScoreNote" sn ON sn."targetType"='score'::"ScoreNoteTarget"
      AND sn."targetId" = x."scoreId" AND sn."noteIndex" = pn."noteIndex"
    JOIN "NoteProfile" np ON np.id = sn."profileId"
    WHERE pn."performanceKind"='score'::"PerformanceKind"
      AND x."audioPath" IS NOT NULL AND x."audioPath" <> ''
    GROUP BY 1,2,3,4,5,6,7
    HAVING COUNT(*) FILTER (WHERE np."techStaccato" OR np."techSpiccato" OR np."techPortato"
                              OR np."techTrill" OR np."techPizzicato") > 0
    ORDER BY 9 ASC, 2 DESC`)
  console.log("日付        曲            対象奏法音  測定値入り  performanceId               scoreId")
  for (const r of rows) {
    console.log(`${r.at.toISOString().slice(0,10)}  ${r.title.slice(0,12).padEnd(13)}${String(Number(r.stac)).padStart(6)}  ${String(Number(r.withDur)).padStart(8)}  ${r.id}  ${r.scoreId}`)
  }
  console.log(`\n該当 ${rows.length} 件`)
  if (rows.length) console.log(`先頭の owner(cuid)=${rows[0].owner} / userId=${rows[0].userId}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
