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
import { buildFastSwitch, type FastSwitchData } from "@/app/_libs/fastSwitch"
import { buildPowersComparison, parseScale, scaleWindows, SCALE_LABEL, pastRange, buildPastFastSwitch } from "@/app/_libs/fivePowers"

export const metadata = { title: "記録の分析" }

export default async function NumbersRoomPage({
  params, searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ scale?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  // 比べる尺度 (2026-09-06 Tetsuo確定): 先週の自分と / 先月の自分と / はじめの自分と。下の箱は「いま」の窓で描く
  const scale = parseScale(sp.scale)
  const period: KartePeriod = SCALE_LABEL[scale].period
  const win = scaleWindows(scale)
  const [d, powers, past] = await Promise.all([
    buildNumbersRoom(dbUserId, period, win.now),
    buildPowersComparison(dbUserId, scale).catch(() => null),
    pastRange(dbUserId, scale).catch(() => null),
  ])
  const [dPast, fastSwitchPast] = past
    ? await Promise.all([buildNumbersRoom(dbUserId, period, past).catch(() => null), buildPastFastSwitch(dbUserId, scale).catch(() => null)])
    : [null, null]

  // 指板ヒートマップ (尺度の「いま」の窓)
  const days = period === "7d" ? 7 : 30
  let heatmap: HeatmapData = { cells: {}, details: {}, perfCount: 0 }
  try { heatmap = await buildUserHeatmap(dbUserId, days) } catch { /* storage不通でも画面は出す */ }

  // 速い指の切り替え (2026-09-02 新設・期間タブ連動)
  let fastSwitch: FastSwitchData | null = null
  try { fastSwitch = await buildFastSwitch(dbUserId, days) } catch { fastSwitch = null }

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
      fastSwitch={fastSwitch}
      scale={scale}
      powers={powers}
      dPast={dPast}
      fastSwitchPast={fastSwitchPast}
    />
  )
}
