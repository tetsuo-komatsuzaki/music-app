// 曲の達成/マスター状態を scoreId ごとにまとめて取得する (2026-08-01)。
// 宿題の「達成/マスター目標」の自動判定に使う。UserScoreAchievement の行の
// 存在＝達成、masteredAt != null ＝マスター。
import { prisma } from "./prisma"

export type AchievementFlag = { achieved: boolean; mastered: boolean }

export async function getAchievementFlags(
  userId: string,
  scoreIds: (string | null | undefined)[],
): Promise<Map<string, AchievementFlag>> {
  const map = new Map<string, AchievementFlag>()
  const ids = [...new Set(scoreIds.filter((s): s is string => !!s))]
  if (ids.length === 0) return map
  try {
    const rows = await prisma.userScoreAchievement.findMany({
      where: { userId, scoreId: { in: ids } },
      select: { scoreId: true, masteredAt: true },
    })
    for (const r of rows) map.set(r.scoreId, { achieved: true, mastered: r.masteredAt != null })
  } catch {
    // テーブル未整備時などは空(未達成扱い)
  }
  return map
}
