import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import type { MaterialKind } from "../app/generated/prisma"

// Phase A backfill (2026-07-18): 既存教材を 1教材=1グループ で MaterialGroup へ束ねる。
// カバーはグループへコピー。冪等 (groupId 未設定のみ処理)。lesson は対象外。
const KIND_OF: Record<string, MaterialKind> = {
  scale: "SCALE",
  arpeggio: "ARPEGGIO",
  etude: "ETUDE",
  fingering: "FINGERING",
  bowing: "BOWING",
  position_shift: "POSITION_SHIFT",
  double_stop: "DOUBLE_STOP",
}

async function main() {
  // --- Score (曲) → SONG グループ ---
  const scores = await prisma.score.findMany({
    where: { groupId: null, deletedAt: null },
    select: { id: true, title: true, composer: true, genre: true, coverImagePath: true },
  })
  let songGroups = 0
  for (const s of scores) {
    const g = await prisma.materialGroup.create({
      data: {
        kind: "SONG", category: "score", title: s.title,
        composer: s.composer || null, genre: s.genre, coverImagePath: s.coverImagePath,
      },
    })
    await prisma.score.update({ where: { id: s.id }, data: { groupId: g.id } })
    songGroups++
  }
  console.log(`SONG グループ: ${songGroups} 作成 (Score ${scores.length}件)`)

  // --- PracticeItem (基礎練/エチュード) → category から kind ---
  const items = await prisma.practiceItem.findMany({
    where: { groupId: null, category: { not: "lesson" } },
    select: { id: true, category: true, title: true, composer: true, coverImagePath: true, sortOrder: true },
  })
  const byKind: Record<string, number> = {}
  let skipped = 0
  for (const it of items) {
    const kind = KIND_OF[it.category as string]
    if (!kind) { skipped++; continue }
    const g = await prisma.materialGroup.create({
      data: {
        kind, category: it.category as string, title: it.title,
        composer: it.composer || null, coverImagePath: it.coverImagePath,
        sortOrder: it.sortOrder ?? 0,
      },
    })
    await prisma.practiceItem.update({ where: { id: it.id }, data: { groupId: g.id } })
    byKind[kind] = (byKind[kind] ?? 0) + 1
  }
  console.log(`PracticeItem グループ:`, byKind, skipped ? `(スキップ ${skipped})` : "")

  // --- 検証 ---
  const sNull = await prisma.score.count({ where: { groupId: null, deletedAt: null } })
  const pNull = await prisma.practiceItem.count({ where: { groupId: null, category: { not: "lesson" } } })
  const total = await prisma.materialGroup.count()
  console.log(`\n未グループ: Score ${sNull} / PracticeItem ${pNull}  | MaterialGroup 総数 ${total}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
