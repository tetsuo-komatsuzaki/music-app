"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Music, Sparkles, Palette } from "lucide-react"
import MyRankCard from "@/app/components/MyRankCard"
import ArcoDaily from "@/app/components/ArcoDaily"
import PracticeFocusCard from "@/app/components/PracticeFocusCard"
import GuideSampleFocus from "@/app/components/GuideSampleFocus"
import NextPiecesCard from "@/app/components/NextPiecesCard"
import FavoritesSection, { type FavoriteEntry } from "@/app/components/FavoritesSection"
import TeacherAssignments, { type StudentAssignment, type TeacherHomeSummary } from "./TeacherAssignments"
import AnalysisNoticeBar, { type AnalysisNotice } from "@/app/components/AnalysisNoticeBar"
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
  /** マイランクカード: 現在★の達成スタンプ (演奏の軌跡) */
  rankCard: {
    currentStar: number
    required: number
    achievedCount: number
    stamps: { scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string }[]
  }
  /** お気に入り (曲/教材) */
  favorites: FavoriteEntry[]
  /** 先生からの宿題 (未完了)。先生機能 MVP (2026-07-28) */
  teacherAssignments: StudentAssignment[]
  /** 先生からの新着サマリ (未読メッセージ/添削件数)。E (2026-08-01) */
  teacherSummary?: TeacherHomeSummary
  /** 解析通知 (2026-08-02): 直近24hの録音の採点状況 (採点中/完了) */
  analysisNotices: AnalysisNotice[]
  /** 🌟 まずはこれから (2026-08-02・旅の地図の後継): 録音0ユーザー向けの最初の1曲。null=非表示 */
  starterPick: { title: string; star: number | null; reason: string; href: string; cover: string | null } | null
  /** 編み込み案4 (2026-08-03): 直近7日で点灯したわざ (レッスンクリア=正式習得のみ) */
  skillLits: { key: string; label: string }[]
  /** 表現の棚 (2026-08-06 案2): きみの表現が活きる曲。null=非表示 (認定なし or タグ付き曲なし) */
  exprShelf: { tagLabel: string; star: number; items: { id: string; title: string; star: number | null; cover: string | null }[] } | null
}

export default function HomeClient({
  userName: _userName,
  basicPracticeCards,
  recentPieces,
  nextPieceRecommendations,
  rankCard,
  favorites,
  teacherAssignments,
  teacherSummary,
  analysisNotices,
  skillLits,
  exprShelf,
  starterPick,
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

      {/* ⓪ 解析通知 (採点中チップ / 完了バナー)。該当なしなら何も出ない */}
      <AnalysisNoticeBar userId={userId} notices={analysisNotices} />
      <SkillLitBanner userId={userId} lits={skillLits} />
      <ExprShelf userId={userId} shelf={exprShelf} />

      {/* 🌟 まずはこれから (録音0ユーザーの一等地。旅の地図の後継・案5「きみへのセレクト」確定 2026-08-02):
          おすすめ1曲だけをドンと出す。弾き始めたら消えて「いま練習している曲」に世代交代 */}
      {!ending && starterPick && recentPieces.length === 0 && (
        <div style={{ position: "relative", overflow: "hidden", background: "#fff", border: "1px solid #eef1f4", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(30,45,70,.05)" }}>
          <span style={{ position: "absolute", top: 14, right: -34, transform: "rotate(38deg)", background: "#c9a227", color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: ".1em", padding: "4px 40px" }}>きみへ</span>
          <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
            <div style={{ flex: "none", width: 74, aspectRatio: "1", borderRadius: 12, background: "linear-gradient(140deg,#dde5f2,#c6d2e6)", display: "grid", placeItems: "center", fontSize: 30, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {starterPick.cover ? <img src={starterPick.cover} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Music size={30} color="#8ba0c4" aria-hidden />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#8a9099", display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkles size={13} /> さいしょの1曲</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#2b3742", lineHeight: 1.35 }}>{starterPick.title}</span>
                {starterPick.star != null && (
                  <span style={{ flex: "none", fontSize: 11, fontWeight: 800, color: "#b7823a", background: "#faf1e1", border: "1px solid #ecdfc8", borderRadius: 999, padding: "2px 9px" }}>★{starterPick.star}</span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "#8a9099", marginTop: 1 }}>{starterPick.reason}</div>
            </div>
          </div>
          <Link href={starterPick.href}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 13, padding: "13px 16px", background: "linear-gradient(135deg,#2563EB,#3B82F6)", color: "#fff", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14.5 }}>
            <span aria-hidden>♪</span> この曲をひく →
          </Link>
        </div>
      )}

      {/* ① マイランクカード (タップで演奏の軌跡／上達のしくみを内蔵) */}
      <MyRankCard {...rankCard} onGuide={() => setGuideOpen(true)} />

      {/* 先生から (未完了の宿題があるときだけ表示・先生機能 MVP) */}
      <TeacherAssignments assignments={teacherAssignments} summary={teacherSummary} />

      {/* ② いま練習している曲 ＋〈マスターへのステップ ‖ 毎日の基礎練〉。
          終盤の締めでは、選んだ曲の「弾いたらこう出る」見本カードに差し替える。
          🌟カード表示中は空状態の文言が重複するため、中身が無ければ丸ごと省略 */}
      {ending ? (
        <GuideSampleFocus piece={onboardingSamplePiece ?? undefined} />
      ) : starterPick && recentPieces.length === 0 && basicPracticeCards.length === 0 ? null : (
        <PracticeFocusCard pieces={recentPieces} basics={basicPracticeCards} userId={userId} />
      )}

      {/* ③ アルコちゃんカード (全身・モーション付き。今日の一言。タップで次のポーズ) */}
      <div className={hb.root}>
        <ArcoDaily />
      </div>

      {/* ④ 次の曲にチャレンジ (同☆の未達成曲)。🌟カード表示中は1位を昇格済みなので残りだけ */}
      <NextPiecesCard pieces={!ending && starterPick && recentPieces.length === 0 ? nextPieceRecommendations.slice(1) : nextPieceRecommendations} />

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

/** 編み込み案4 (2026-08-03): わざ点灯の祝いバナー。
 * レッスンクリア(正式習得)から7日以内のわざを金色バナーで祝い、カルテ技術マップへの入口にする。
 * 既読は localStorage (キー単位) — 一度とじたわざは再表示しない。 */
function SkillLitBanner({ userId, lits }: { userId: string; lits: { key: string; label: string }[] }) {
  const SEEN_KEY = "arcoda_seen_skill_lit_v1"
  const [visible, setVisible] = useState<{ key: string; label: string }[]>([])
  useEffect(() => {
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]")
      setVisible(lits.filter((l) => !seen.includes(l.key)))
    } catch { setVisible(lits) }
  }, [lits])
  if (visible.length === 0) return null
  const dismiss = () => {
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]")
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, ...visible.map((l) => l.key)])]))
    } catch { /* 保存できなくても表示は消す */ }
    setVisible([])
  }
  const labels = visible.map((l) => `「${l.label}」`).join("と")
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px", padding: "10px 12px",
      borderRadius: 12, background: "linear-gradient(135deg,#fdf6e0,#f9ecc8)", border: "1px solid #eed9a0",
    }}>
      <span style={{ fontSize: 18 }}>⭐</span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: "#7a6420", lineHeight: 1.5 }}>
        わざ{labels}が点灯したよ！🎉
        <Link href={`/${userId}/progress`} style={{ marginLeft: 6, color: "#4a5bd0", textDecoration: "underline", fontWeight: 800 }}>
          カルテの技術マップで見る
        </Link>
      </div>
      <button type="button" onClick={dismiss} aria-label="とじる"
        style={{ flex: "none", border: "none", background: "none", color: "#b8a260", fontSize: 14, cursor: "pointer", padding: 4 }}>
        ✕
      </button>
    </div>
  )
}

/** 表現の棚 (2026-08-06 案2): きみの表現(先生認定の強み)が活きる曲の横スクロール棚 */
function ExprShelf({ userId, shelf }: { userId: string; shelf: Props["exprShelf"] }) {
  if (!shelf) return null
  return (
    <div style={{ margin: "0 0 12px" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "#3a3428", display: "inline-flex", alignItems: "center", gap: 5 }}><Palette size={15} /> きみの表現が活きる曲</div>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: "#8a5a1f", margin: "1px 0 7px" }}>
        {shelf.tagLabel} ★{shelf.star} の きみへ
      </div>
      <div style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }}>
        {shelf.items.map((s) => (
          <Link key={s.id} href={`/${userId}/scores/${s.id}`}
            style={{ flex: "none", width: 92, textDecoration: "none", color: "inherit" }}>
            <div style={{
              height: 64, borderRadius: 9, overflow: "hidden",
              background: s.cover ? `url(${s.cover}) center/cover` : "linear-gradient(150deg,#e8c96a,#c9932a)",
              display: "grid", placeItems: "center", fontSize: 20,
            }}>{s.cover ? null : <Music size={20} color="#fff" aria-hidden />}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {s.title}
            </div>
            {s.star != null && <div style={{ fontSize: 9.5, fontWeight: 800, color: "#a97b1f" }}>★{s.star}</div>}
          </Link>
        ))}
      </div>
    </div>
  )
}
