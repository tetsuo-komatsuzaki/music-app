// 記録の分析 (Phase2 D3・2026-08-03)。カルテ⑤の詳細画面: 調→テンポ→音→移動の
// 掘れるツリー全体 + 得意も苦手も一覧 + 今週うごいた枝。
// 2026-08-11: 描画本体は NumbersRoomView に共有化 (先生の生徒閲覧ページと共用)。
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { buildNumbersRoom, type KartePeriod } from "@/app/_libs/growthKarte"
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

  return (
    <NumbersRoomView
      d={d}
      period={period}
      baseHref={`/${authUserId}/progress/numbers`}
      backHref={`/${authUserId}/progress`}
      backLabel="成長カルテ"
    />
  )
}
