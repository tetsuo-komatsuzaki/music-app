// app/[userId]/progress/page.tsx
//
// 成長カルテ (2026-08-02 全面作り替え)。
// 旧・成長記録(グレード/達成一覧/教材件数/あゆみ/3つルールカレンダー)を廃止し、
// 「練習データを意味のある知見に変換する診断書」= カルテ4章構成に再定義:
//   1. 練習の実態 (日数/回数/内訳/調カバレッジ/録音ベースのカレンダー)
//   2. 音の安定マップ (音の動き方グリッド/奏法別/音程×リズム)
//   3. 所見 (苦手×練習不足の相関知見 + 行動導線)
//   4. 成長の物語 (達成/マスター/提出/添削/先生の所見/お祝い)
// 集計は app/_libs/growthKarte.ts (既存データのみ・新テーブル不要)。

import { prisma } from "@/app/_libs/prisma"
import { buildKarteData, type KartePeriod } from "@/app/_libs/growthKarte"
import ProgressPage from "./progressPage"

export const metadata = { title: "成長カルテ" }

type PageProps = {
  params: Promise<{ userId: string }>
}

// カルテ本体は30日固定 (2026-08-06 Tetsuo確定: 期間タブは①⑤にしか効かず嘘のシグナルだった)。
// 期間切替は「記録の分析」(numbers) にだけ残す。
export default async function ProgressServerPage({ params }: PageProps) {
  const { userId } = await params
  const period: KartePeriod = "30d"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  // 報酬体系 (骨組み): カルテ閲覧クエスト+閲覧回数カウント (点灯前は不動)
  try {
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUser.id, "karte_view")
  } catch { /* 発火失敗でカルテを止めない */ }

  const data = await buildKarteData(dbUser.id, userId, period)

  return <ProgressPage userId={userId} data={data} />
}
