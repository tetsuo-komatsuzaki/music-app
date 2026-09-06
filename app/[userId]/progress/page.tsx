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
import { buildKarteData, buildNumbersRoom, type KartePeriod } from "@/app/_libs/growthKarte"
import ProgressPage from "./progressPage"
import GuestGate from "@/app/components/guest/GuestGate"
import { GATE_TEXT } from "@/app/components/guest/gateText"
import { GUEST_ID } from "@/app/_libs/viewer"
import { DEMO_AUTH_ID, DEMO_DB_ID } from "../_guest/sample"

export const metadata = { title: "成長カルテ" }

type PageProps = {
  params: Promise<{ userId: string }>
}

// カルテ本体は30日固定 (2026-08-06 Tetsuo確定: 期間タブは①⑤にしか効かず嘘のシグナルだった)。
// 期間切替は「記録の分析」(numbers) にだけ残す。
export default async function ProgressServerPage({ params }: PageProps) {
  const { userId } = await params
  const period: KartePeriod = "30d"
  // ゲスト閲覧 (2026-09-06): 運営アカウントの見本データで本物の成長カルテを描き、上にゲートを重ねる (DB には書かない)
  const guest = userId === GUEST_ID
  const dbUser = guest
    ? { id: DEMO_DB_ID }
    : await prisma.user.findUnique({
        where: { supabaseUserId: userId },
        select: { id: true },
      })
  if (!dbUser) return <div>User not found</div>
  const karteAuthId = guest ? DEMO_AUTH_ID : userId
  // 報酬体系 (骨組み): カルテ閲覧クエスト+閲覧回数カウント (点灯前は不動)
  if (!guest) {
    try {
      const { questEventHook } = await import("@/app/_libs/treasureEngine")
      await questEventHook(dbUser.id, "karte_view")
    } catch { /* 発火失敗でカルテを止めない */ }
  }
  const data = await buildKarteData(dbUser.id, karteAuthId, period)

  // カードアルバム (2026-08-31 Tetsuo確定): クエストカードの置き場はカルテ配下。点灯時のみ章を出す
  let cardAlbum: { got: number; total: number } | null = null
  try {
    const { rewardSystemLit } = await import("@/app/_libs/treasureEngine")
    if (rewardSystemLit()) {
      const { QUESTS } = await import("@/app/_libs/treasureCatalog")
      const cardQuests = QUESTS.filter((q) => q.grade !== "cert")
      const ids = new Set(cardQuests.map((q) => q.questId))
      const clears = await prisma.userQuestClear.findMany({
        where: { userId: dbUser.id },
        select: { questId: true },
      })
      cardAlbum = { got: clears.filter((c) => ids.has(c.questId)).length, total: cardQuests.length }
    }
  } catch { /* アルバム集計の失敗でカルテを止めない */ }

  // 成長カーブ (2026-09-02 Tetsuo確定): カルテのトップに置くのはこれだけ。
  // 指板・ポジション移動・速い指の切り替え・奏法べつは記録の分析の担当で、
  // 同じ絵を2画面に出さない。線の作りは記録の分析の成長カーブと同一 (30日)。
  let curve: { day: string; score: number; best: boolean }[] = []
  let current: { avg: number; delta: number | null } | null = null
  try {
    // 成長カーブだけは全期間 (2026-09-02 Tetsuo確定)。カルテ本体は30日固定のまま
    const nr = await buildNumbersRoom(dbUser.id, "all")
    curve = nr.curve
    current = nr.current
  } catch { /* 集計に失敗してもカルテは出す */ }

  const page = <ProgressPage userId={userId} data={data} cardAlbum={cardAlbum} curve={curve} current={current} />
  if (guest) return <GuestGate title={GATE_TEXT.karte.title} items={[...GATE_TEXT.karte.items]}>{page}</GuestGate>
  return page
}
