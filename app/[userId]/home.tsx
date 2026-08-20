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
import ds from "@/app/components/ds.module.css"
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
  userName,
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

      {/* 挨拶の大見出し (モック HELLO ・ h1.t)。名前が長くても1行に収める (2026-08-20 Tetsuo指定) */}
      <h1
        className={ds.t}
        style={{
          paddingTop: 6,
          whiteSpace: "nowrap",
          fontSize: userName.length <= 5 ? 27 : userName.length <= 9 ? 22 : 19,
        }}
      >
        こんにちは、{userName}さん
      </h1>

      {/* モック home-01 の並び: 先生から → 通知 → ランク (2026-08-21 再写経で是正) */}
      <TeacherAssignments assignments={teacherAssignments} summary={teacherSummary} />

      {/* 解析通知 (採点中チップ / 完了バナー)。該当なしなら何も出ない */}
      <AnalysisNoticeBar userId={userId} notices={analysisNotices} />
      <SkillLitBanner userId={userId} lits={skillLits} />
      <ExprShelf userId={userId} shelf={exprShelf} />

      {/* 🌟 まずはこれから (録音0ユーザーの一等地。旅の地図の後継・案5「きみへのセレクト」確定 2026-08-02):
          おすすめ1曲だけをドンと出す。弾き始めたら消えて「いま練習している曲」に世代交代 */}
      {/* モック 追03 STARTER の写経: 金ラベル → 青バナー → 注記 → 金CTA → ほかの曲リンク */}
      {!ending && starterPick && recentPieces.length === 0 && (
        <div className={ds.card} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 15px 0" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "var(--gold)" }}>✦ さいしょの1曲</div>
          </div>
          <Link href={starterPick.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", marginTop: 9, background: "linear-gradient(135deg,#1F3D78,#2B5BC4)", textDecoration: "none" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, flex: "none", display: "grid", placeItems: "center", background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 22, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {starterPick.cover ? <img src={starterPick.cover} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "♪"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.25 }}>{starterPick.title}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#CDD9F2", marginTop: 2 }}>
                {starterPick.star != null ? `☆${starterPick.star} ・ ` : ""}{starterPick.reason}
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", flex: "none" }} aria-hidden>→</span>
          </Link>
          <div style={{ padding: "12px 15px 15px" }}>
            <div style={{ fontSize: 11, color: "var(--text-sub)" }}>☆が小さいほど やさしい曲だよ</div>
            <Link href={starterPick.href} style={{ display: "block", marginTop: 11, background: "linear-gradient(180deg,#E8B23C,#D2992C)", borderRadius: 14, padding: 13, textAlign: "center", color: "#201604", fontWeight: 900, fontSize: 14, textDecoration: "none" }}>
              さっそく始めよう
            </Link>
            <div style={{ textAlign: "center", marginTop: 9 }}>
              <Link href={`/${userId}/practice/pieces`} style={{ fontSize: 11, color: "#7FA4E8", fontWeight: 800, textDecoration: "none" }}>ほかの曲を選ぶ</Link>
            </div>
          </div>
        </div>
      )}

      {/* マイランクカード (タップで演奏の軌跡／上達のしくみを内蔵) */}
      <MyRankCard {...rankCard} onGuide={() => setGuideOpen(true)} />

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
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 16px", background: "linear-gradient(105deg,var(--accent),#1f3d78)", boxShadow: "0 5px 14px -6px rgba(43,91,196,.6)", color: "var(--text-on-accent)", borderRadius: 14, textDecoration: "none", fontWeight: 800, fontSize: "var(--fs-subhead)" }}
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
      borderRadius: 12, background: "rgba(232,178,60,.14)", border: "1px solid rgba(232,178,60,.3)",
    }}>
      <Sparkles size={18} color="var(--gold)" style={{ flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--gold)", lineHeight: 1.5 }}>
        わざ{labels}が点灯したよ！
        <Link href={`/${userId}/progress`} style={{ marginLeft: 6, color: "#7aa7ff", textDecoration: "underline", fontWeight: 800 }}>
          カルテの技術マップで見る
        </Link>
      </div>
      <button type="button" onClick={dismiss} aria-label="とじる"
        style={{ flex: "none", border: "none", background: "none", color: "var(--gold)", fontSize: "var(--fs-subhead)", cursor: "pointer", padding: 4 }}>
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
      <div style={{ fontSize: "var(--fs-body)", fontWeight: 900, color: "var(--text-ink)", display: "inline-flex", alignItems: "center", gap: 5 }}><Palette size={15} /> きみの表現が活きる曲</div>
      <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", margin: "1px 0 7px" }}>
        {shelf.tagLabel} ★{shelf.star} の きみへ
      </div>
      <div style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }}>
        {shelf.items.map((s) => (
          <Link key={s.id} href={`/${userId}/scores/${s.id}`}
            style={{ flex: "none", width: 92, textDecoration: "none", color: "inherit" }}>
            <div style={{
              height: 64, borderRadius: 9, overflow: "hidden",
              background: s.cover ? `url(${s.cover}) center/cover` : "linear-gradient(150deg,#e8c96a,#c9932a)",
              display: "grid", placeItems: "center", fontSize: "var(--fs-head)",
            }}>{s.cover ? null : <Music size={20} color="#fff" aria-hidden />}</div>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {s.title}
            </div>
            {s.star != null && <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-master)" }}>★{s.star}</div>}
          </Link>
        ))}
      </div>
    </div>
  )
}
