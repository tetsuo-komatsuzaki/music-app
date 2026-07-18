// 教材グループ (MaterialGroup) の生成・紐付けヘルパー (2026-07-18 Phase A-2)。
// 新規アップロード時に 1教材=1グループ を作り orphan を防ぐ。将来は Phase B の
// 管理UIで「既存グループに変種を追加」に発展するが、当面は 1:1 を維持する。
import { prisma } from "./prisma"
import type { MaterialKind } from "../generated/prisma"

export const MATERIAL_KIND_BY_CATEGORY: Record<string, MaterialKind> = {
  scale: "SCALE",
  arpeggio: "ARPEGGIO",
  etude: "ETUDE",
  fingering: "FINGERING",
  bowing: "BOWING",
  position_shift: "POSITION_SHIFT",
  double_stop: "DOUBLE_STOP",
}

/** Score(曲) 用の SONG グループを作成し紐付ける。既に groupId があれば据え置き。 */
export async function ensureScoreGroup(scoreId: string): Promise<string | null> {
  const s = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, groupId: true, title: true, composer: true, genre: true, coverImagePath: true },
  })
  if (!s) return null
  if (s.groupId) return s.groupId
  const g = await prisma.materialGroup.create({
    data: {
      kind: "SONG", category: "score", title: s.title,
      composer: s.composer || null, genre: s.genre, coverImagePath: s.coverImagePath,
    },
  })
  await prisma.score.update({ where: { id: scoreId }, data: { groupId: g.id } })
  return g.id
}

/** PracticeItem 用のグループを作成し紐付ける。lesson / マップ外カテゴリは対象外(null)。 */
export async function ensurePracticeItemGroup(itemId: string): Promise<string | null> {
  const it = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, groupId: true, category: true, title: true, composer: true, coverImagePath: true },
  })
  if (!it) return null
  if (it.groupId) return it.groupId
  const kind = MATERIAL_KIND_BY_CATEGORY[it.category as string]
  if (!kind) return null
  const g = await prisma.materialGroup.create({
    data: {
      kind, category: it.category as string, title: it.title,
      composer: it.composer || null, coverImagePath: it.coverImagePath,
    },
  })
  await prisma.practiceItem.update({ where: { id: itemId }, data: { groupId: g.id } })
  return g.id
}
