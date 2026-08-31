"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Music, Sparkles, Palette } from "lucide-react"
import MyRankCard from "@/app/components/MyRankCard"
import PracticeFocusCard from "@/app/components/PracticeFocusCard"
import NextPiecesCard from "@/app/components/NextPiecesCard"
import FavoritesSection, { type FavoriteEntry } from "@/app/components/FavoritesSection"
import TeacherAssignments, { type StudentAssignment, type TeacherHomeSummary } from "./TeacherAssignments"
import AnalysisNoticeBar, { type AnalysisNotice } from "@/app/components/AnalysisNoticeBar"
import ds from "@/app/components/ds.module.css"
import type { SongRecommendation } from "@/app/components/RecommendationItem"
import type { GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./home.module.css"
import QuestBoard from "./_guide/QuestBoard"
import QuestBoardLit from "./_gallery/QuestBoardLit"
import type { QuestProgress } from "./_guide/quests"

// 「アルコと最初の1周」チュートリアル (2026-08-29 本番接続)。
// 対象ユーザーのときだけ遅延ロードし、通常ユーザーのバンドルを重くしない
const GuideTutorial = dynamic(() => import("./_guide/GuideTutorial"), { ssr: false })

// 達成コインの獲得モーション (2026-08-30)。未演出コインがある帰着時のみロード
const CoinCelebration = dynamic(() => import("./_coin/CoinCelebration"), { ssr: false })
import { COIN_FX_IDLE, type CoinFx, type CoinQueueItem } from "./_coin/CoinCelebration"

// 報酬体系「ギャラリー」の授与 (骨組み・点灯前はキュー空で不動)
const TreasureCelebration = dynamic(() => import("./_coin/TreasureCelebration"), { ssr: false })
import type { TreasureQueueItem } from "./_coin/TreasureCelebration"

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
  /** 「アルコと最初の1周」ガイド。active=未完了・未スキップ (先生ロールは常にfalse) */
  guide: { active: boolean; initialStep: number }
  /** アルコのクエスト進行 (ガイド完了ユーザーのみ非null) */
  questProgress: QuestProgress | null
  /** 新クエストボードのクリア済みID (報酬体系点灯時のみ非null・旧questProgressと排他) */
  homeQuestClears?: string[] | null
  /** 達成コインの未演出キュー (2026-08-30)。ガイド中・先生ロールはサーバー側で空 */
  coinQueue?: CoinQueueItem[]
  /** devハーネス (/dev/coin-demo): 消化のDB書込をしない */
  coinDemo?: boolean
  /** 宝物の授与待ちキュー (報酬体系骨組み・点灯前は常に空) */
  treasureQueue?: TreasureQueueItem[]
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
    /** ギャラリー3棚 (点灯時のみ非null。軌跡シートを差し替える) */
    gallery?: import("@/app/_libs/treasureEngine").GalleryData | null
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

// アルコからひとこと (proto画面4 ・ 日替わり仮実装 2026-08-23。将来は録音の変化から生成)
const ARCO_HITOKOTO = [
  "きのうより、音がまっすぐになってきたよ。",
  "今日の1曲が、あしたの自信になるよ。",
  "ゆっくりでいいよ。いっしょに鳴らそう。",
  "きみの音、すこしずつ深くなってるよ。",
  "むずかしい日は、好きな曲からでいいんだよ。",
  "弓をかまえたら、もう半分できてるよ。",
  "小さな1回が、いちばん大きい練習だよ。",
] as const

export default function HomeClient({
  guide,
  questProgress,
  homeQuestClears,
  coinQueue,
  coinDemo,
  treasureQueue,
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
  const router = useRouter()
  // チュートリアル終了後は層をアンマウントし、ホームのデータを取り直す (コイン等の反映)
  const [guideDismissed, setGuideDismissed] = useState(false)
  // ヘルプの「もう一度見る」等でガイドが再び有効になったら、閉じたフラグを戻す
  useEffect(() => { if (guide?.active) setGuideDismissed(false) }, [guide?.active])
  const showGuide = guide?.active && !guideDismissed

  // ── 達成コインの獲得モーション (2026-08-30 Tetsuo確定・案A) ──
  // 演出で飛ぶのは「いま練習している曲」タブに居る曲のみ・最大2枚 (Q16/Q3)。
  // 残りは演出なしでゲージ反映のみ (消化は CoinCelebration がまとめて行う)
  const queue = coinQueue ?? []
  const flying = useMemo(
    () => queue.filter((c) => recentPieces.some((p) => p.id === c.scoreId)).slice(0, 2),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue.map((c) => c.scoreId).join(","), recentPieces.map((p) => p.id).join(",")],
  )
  const showCoins = queue.length > 0 && !showGuide
  // 初期状態から巻き戻し+タブ選択を効かせる (マスター表示が一瞬見える事故の防止)
  const [coinFx, setCoinFx] = useState<CoinFx>(() =>
    showCoins && flying.length > 0
      ? {
          rankHold: flying.filter((c) => c.star === rankCard.currentStar).length,
          focus: { scoreId: flying[0].scoreId, rewind: true, trigger: flying[0].trigger ?? "run" },
          flashAt: 0,
        }
      : COIN_FX_IDLE,
  )
  const shownRankCard = coinFx.rankHold > 0
    ? { ...rankCard, achievedCount: Math.max(0, rankCard.achievedCount - coinFx.rankHold) }
    : rankCard

  // 宝物の授与 (骨組み): コイン工程の完了後に直列で流す (実装仕様§4)
  const [coinsDone, setCoinsDone] = useState(false)
  const showTreasures =
    (treasureQueue?.length ?? 0) > 0 && !showGuide && (!showCoins || coinsDone)


  return (
    <div className={styles.page}>
      {showGuide && (
        <GuideTutorial
          initialStep={guide.initialStep}
          onDone={() => { setGuideDismissed(true); router.refresh() }}
        />
      )}

      {/* 達成コインの獲得モーション (帰着時1回・タップでスキップ) */}
      {showCoins && <CoinCelebration flying={flying} currentStar={rankCard.currentStar} demo={coinDemo} onFx={setCoinFx} onDone={() => setCoinsDone(true)} />}

      {/* 宝物の授与 (報酬体系骨組み・コイン完了後に直列・点灯前はキュー空) */}
      {showTreasures && (
        <TreasureCelebration
          queue={treasureQueue ?? []}
          coinMotionCount={showCoins ? Math.min(2, flying.length) : 0}
          demo={coinDemo}
        />
      )}

      {/* 挨拶の大見出し (モック HELLO ・ h1.t)。名前が長くても1行に収める (2026-08-20 Tetsuo指定)。
          2026-08-23 Tetsuo指示: 挨拶右の金縁アルコは削除し、マイランクカード側へ移設 */}
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

      {/* アルコからひとこと (2026-08-23 proto画面4写経: 紙カード ・ 文言は日替わり仮実装) */}
      <div style={{
        position: "relative", borderRadius: 14, padding: "14px 17px", marginTop: 10,
        background: "repeating-linear-gradient(0deg, transparent 0 27px, rgba(22,41,79,0.04) 27px 28px), linear-gradient(180deg, #f9f4e8, #ede4ce)",
        boxShadow: "0 6px 18px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.2)",
      }}>
        <span aria-hidden style={{ position: "absolute", top: 9, left: 9, width: 6, height: 6, borderRadius: "50%", background: "#d4af37", boxShadow: "0 1px 2px rgba(0,0,0,.3)" }} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.8, color: "#2a3450" }}>
          {ARCO_HITOKOTO[new Date().getDate() % ARCO_HITOKOTO.length]}
        </p>
        <span style={{ display: "block", textAlign: "right", fontSize: 11, color: "#6b6455", marginTop: 2 }}>―― アルコからひとこと</span>
      </div>

      {/* モック home-01 の並び: 先生から → 通知 → ランク (2026-08-21 再写経で是正) */}
      <TeacherAssignments assignments={teacherAssignments} summary={teacherSummary} />

      {/* アルコのクエスト (2周目以降=ガイド完了ユーザー)。折り畳みが既定・先生からカードの下 (2026-08-29 Tetsuo指定) */}
      {homeQuestClears != null
        ? <QuestBoardLit cleared={homeQuestClears} />
        : questProgress && <QuestBoard progress={questProgress} />}

      {/* 解析通知 (採点中チップ / 完了バナー)。該当なしなら何も出ない */}
      <AnalysisNoticeBar userId={userId} notices={analysisNotices} />
      <SkillLitBanner userId={userId} lits={skillLits} />
      <ExprShelf userId={userId} shelf={exprShelf} />

      {/* 🌟 まずはこれから (録音0ユーザーの一等地。旅の地図の後継・案5「きみへのセレクト」確定 2026-08-02):
          おすすめ1曲だけをドンと出す。弾き始めたら消えて「いま練習している曲」に世代交代 */}
      {/* モック 追03 STARTER の写経: 金ラベル → 青バナー → 注記 → 金CTA → ほかの曲リンク */}
      
      {/* マイランクカード (タップで即ギャラリー。上達のしくみは使い方ページへ移籍・2026-08-31) */}
      <MyRankCard {...shownRankCard} flashAt={coinFx.flashAt} />

      {starterPick && recentPieces.length === 0 && (
        <div className={ds.card} data-guide="home-starter" style={{ padding: 0, overflow: "hidden" }}>
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

      {/* ② いま練習している曲 ＋〈マスターへのステップ ‖ 毎日の基礎練〉。
          終盤の締めでは、選んだ曲の「弾いたらこう出る」見本カードに差し替える。
          🌟カード表示中は空状態の文言が重複するため、中身が無ければ丸ごと省略 */}
      {starterPick && recentPieces.length === 0 && basicPracticeCards.length === 0 ? null : (
        <PracticeFocusCard pieces={recentPieces} basics={basicPracticeCards} userId={userId} coinFocus={coinFx.focus} />
      )}


      {/* アルコちゃんの一言カードは削除 (2026-08-21 Tetsuo指示・SPEC-CHANGES記載) */}

      {/* ④ 次の曲にチャレンジ (同☆の未達成曲)。🌟カード表示中は1位を昇格済みなので残りだけ */}
      <NextPiecesCard pieces={starterPick && recentPieces.length === 0 ? nextPieceRecommendations.slice(1) : nextPieceRecommendations} />

      {/* ⑤ お気に入り (曲・音階・アルペジオ・エチュード・ボーイング・フィンガリング・重音) */}
      <FavoritesSection favorites={favorites} />

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
