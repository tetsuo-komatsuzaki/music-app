"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import MyRankCard from "@/app/components/MyRankCard"
import ArcoDaily from "@/app/components/ArcoDaily"
import PracticeFocusCard from "@/app/components/PracticeFocusCard"
import GuideSampleFocus from "@/app/components/GuideSampleFocus"
import NextPiecesCard from "@/app/components/NextPiecesCard"
import FavoritesSection, { type FavoriteEntry } from "@/app/components/FavoritesSection"
import hb from "./homeBlocks.module.css"
import ProgressGuideModal from "@/app/components/ProgressGuideModal"
import type { SongRecommendation } from "@/app/components/RecommendationItem"
import type { GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./home.module.css"
import OnboardingTrigger from "./_onboarding/OnboardingTrigger"
import { useOnboarding } from "./_onboarding/hooks/useOnboarding"

// v1.6 Phase 4-2 (2026-05-16) — UserGradeProgress 準拠の表示用データ。
// 仕様書 §3-5-2 必須項目: 現在グレード + ★ + 次の★まで完全習得すべき曲数
type GradeData = {
  currentStar: number
  currentGrade: GradeLevel
  masteredSongCountAtCurrentStar: number
  gradeUpRequired: number
  gradeUpRemaining: number
  isMaster: boolean
  masterReachedAt: string | null
}

type Props = {
  userName: string
  streak: number
  weeklyDays: number
  arcoMessage: { greeting: string; cheer: string }
  /** v1.6 §3-5-2: アルコちゃんカード内に表示するグレード情報 */
  gradeData: GradeData
  /** 基礎練習の練習状況: 直近に練習した、まだクリアしていない基礎練 */
  basicPracticeCards: {
    id: string
    title: string
    category: string
    href: string
    lastPracticedAt: string
    recentScore: number | null
    todayCount: number
  }[]
  /** 直近の練習曲 (Score) + 曲別 直近平均スコア + 達成/マスターバッジ (C-6b) */
  recentPieces: {
    id: string
    title: string
    star: number | null
    cover: string | null
    latest: number
    recentAvg: number | null
    badge: "mastered" | "achieved" | null
    href: string
  }[]
  /** 弱点なし時の「次の曲にチャレンジ」: 同じ★の未達成曲 */
  nextPieceRecommendations: SongRecommendation[]
  /** 旅の地図: オンボーディングの目標曲/Epic Win 常設 (null=未回答ユーザー) */
  journeyMap: {
    songName: string
    songStar: number
    /** 目標曲が楽譜(Score)と結線済みなら詳細ページへのリンク */
    songHref: string | null
    achieved: boolean
    /** 到達予測 (現在の★とQ6回答で再計算)。達成済みなら null */
    periodLabel: string | null
    daily: string | null
    epicWin: string | null
    goalDate: string | null
  } | null
  /** マイランクカード: 現在★の達成スタンプ (演奏の軌跡) */
  rankCard: {
    currentStar: number
    required: number
    achievedCount: number
    stamps: { scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string }[]
  }
  /** お気に入り (曲/教材) */
  favorites: FavoriteEntry[]
}

export default function HomeClient({
  userName: _userName,
  basicPracticeCards,
  recentPieces,
  nextPieceRecommendations,
  rankCard,
  favorites,
}: Props) {
  void _userName
  const { userId } = useParams<{ userId: string }>()
  const { onboardingSamplePiece, onboardingEnding, setOnboardingEnding } = useOnboarding()
  const [guideOpen, setGuideOpen] = useState(false)

  // オンボ終盤の締め: 練習教材まで来て「締め」が armed のまま、まだ1曲も弾いていない
  // ユーザーがホームに戻ってきたとき、「弾いたらこう出る」の見本を見せて締めガイドを出す。
  // サイドバーの「ホーム」からも戻れるよう URL ではなくフラグ (onboardingEnding) で駆動する。
  // 選んだ曲があればその曲で、無ければ既定の見本で出す。
  const ending = onboardingEnding && recentPieces.length === 0

  return (
    <div className={styles.page}>

      {/* ① マイランクカード (最上部・タップで演奏の軌跡／上達のしくみを内蔵) */}
      <MyRankCard {...rankCard} onGuide={() => setGuideOpen(true)} />

      {/* ② いま練習している曲 ＋〈マスターへのステップ ‖ 毎日の基礎練〉。
          終盤の締めでは、選んだ曲の「弾いたらこう出る」見本カードに差し替える。 */}
      {ending ? (
        <GuideSampleFocus piece={onboardingSamplePiece ?? undefined} />
      ) : (
        <PracticeFocusCard pieces={recentPieces} basics={basicPracticeCards} userId={userId} />
      )}

      {/* ③ アルコちゃんカード (全身・モーション付き。今日の一言。タップで次のポーズ) */}
      <div className={hb.root}>
        <ArcoDaily />
      </div>

      {/* ④ 次の曲にチャレンジ (同☆の未達成曲) */}
      <NextPiecesCard pieces={nextPieceRecommendations} />

      {/* ⑤ お気に入り (曲・音階・アルペジオ・エチュード・ボーイング・フィンガリング・重音) */}
      <FavoritesSection favorites={favorites} />

      {/* ⑥ 終盤の締め: さっそく本物の1曲へ (見本ホームからの出口)。
          自分の楽譜の持ち込みは homeEnding.upload ガイドが左サイドバーの
          「マイライブラリー」を案内する (専用ボタンは作らない)。 */}
      {ending && (
        <Link
          href={`/${userId}/practice/pieces`}
          data-onboarding="home.startCta"
          onClick={() => setOnboardingEnding(false)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", background: "linear-gradient(135deg,#2563EB,#3B82F6)", color: "#fff", borderRadius: 14, textDecoration: "none", fontWeight: 800, fontSize: 15 }}
        >
          <span aria-hidden>♪</span> さっそく1曲、弾いてみよう
        </Link>
      )}

      <ProgressGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <OnboardingTrigger pageKey={ending ? "homeEnding" : "home"} />
    </div>
  )
}
