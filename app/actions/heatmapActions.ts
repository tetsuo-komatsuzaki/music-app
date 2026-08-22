"use server"

// 音程マップの範囲切替 (2026-08-22 Tetsuo指示: 直近3/5/10回/全部 ・ 1週間/1ヶ月)。
// ふりかえりタブのマップカードから呼ぶ。集計は buildTargetHeatmap をそのまま使う。
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { buildTargetHeatmap } from "@/app/_libs/fingerboard/aggregate"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"

const ALL_CAP = 200 // 全部: 実質全件 (暴走防止の上限)

export async function getSongHeatmapRange(
  kind: "score" | "practice",
  targetId: string,
  opts: { count?: number | null; sinceDays?: number | null },
): Promise<HeatmapData | null> {
  const auth = await requireAuthAction()
  if (!auth.ok) return null
  const count = opts.count && opts.count > 0 ? Math.min(opts.count, ALL_CAP) : ALL_CAP
  const since = opts.sinceDays && opts.sinceDays > 0 ? new Date(Date.now() - opts.sinceDays * 864e5) : null
  try {
    return await buildTargetHeatmap(auth.user.dbUser.id, kind, targetId, count, since)
  } catch {
    return null
  }
}
