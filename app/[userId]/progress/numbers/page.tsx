// 記録の分析 (Phase2 D3・2026-08-03)。カルテ⑤の詳細画面: 調→テンポ→音→移動の
// 掘れるツリー全体 + 得意も苦手も一覧 + 今週うごいた枝。
// 2026-08-11: 描画本体は NumbersRoomView に共有化 (先生の生徒閲覧ページと共用)。
// 2026-08-11: 音程は指板ヒートマップ (期間タブ連動) + 先生の「気をつける音」マーク表示。
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { prisma } from "@/app/_libs/prisma"
import { buildNumbersRoom, type KartePeriod } from "@/app/_libs/growthKarte"
import { buildUserHeatmap } from "@/app/_libs/fingerboard/aggregate"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import NumbersRoomView from "@/app/components/NumbersRoomView"

export const metadata = { title: "記録の分析" }

export default async function NumbersRoomPage({
  params, searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const period: KartePeriod = sp.period === "7d" ? "7d" : sp.period === "all" ? "all" : "30d"
  const d = await buildNumbersRoom(dbUserId, period)

  // 指板ヒートマップ (期間タブ連動。all は直近1年で近似)
  const days = period === "7d" ? 7 : period === "all" ? 365 : 30
  let heatmap: HeatmapData = { cells: {}, details: {}, perfCount: 0 }
  try { heatmap = await buildUserHeatmap(dbUserId, days) } catch { /* storage不通でも画面は出す */ }

  // 先生の「気をつける音」マーク (担当先生がいれば表示)
  let fbMarks: { cellId: string; note: string }[] = []
  try {
    fbMarks = (await prisma.teacherMarkedCell.findMany({
      where: { studentId: dbUserId },
      select: { cellId: true, note: true },
    })).map((m) => ({ cellId: m.cellId, note: m.note }))
  } catch { fbMarks = [] }

  return (
    <NumbersRoomView
      d={d}
      period={period}
      baseHref={`/${authUserId}/progress/numbers`}
      backHref={`/${authUserId}/progress`}
      backLabel="成長カルテ"
      heatmap={heatmap}
      fbMarks={fbMarks}
      practiceBase={`/${authUserId}/practice`}
    />
  )
}
