"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CumulativeWeaknessPanel } from "@/app/components/WeaknessDiagnosisCard"
import GradeBadge from "@/app/components/GradeBadge"
import MasterBadge from "@/app/components/MasterBadge"
import MyRankCard from "@/app/components/MyRankCard"
import ProgressGuideModal from "@/app/components/ProgressGuideModal"
import GradeProgressBar from "@/app/components/GradeProgressBar"
import RecommendationList from "@/app/components/RecommendationList"
import type { SongRecommendation } from "@/app/components/RecommendationItem"
import type { GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./home.module.css"
import OnboardingTrigger from "./_onboarding/OnboardingTrigger"

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
  }[]
  /** 直近の練習曲 (Score) + 曲別 直近平均スコア + 達成/マスターバッジ (C-6b) */
  recentPieces: {
    id: string
    title: string
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
}

// スコア → ランク色 (scoreDetail と同じ閾値)
function scoreColor(score: number): { color: string; bg: string } {
  if (score >= 90) return { color: "#085041", bg: "#E1F5EE" }
  if (score >= 75) return { color: "#0C447C", bg: "#E6F1FB" }
  if (score >= 60) return { color: "#633806", bg: "#FAEEDA" }
  return { color: "#791F1F", bg: "#FCEBEB" }
}

// ─── 時間を相対表示 ───────────────────────────────────────────
function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}分前`
  if (hours < 24)  return `${hours}時間前`
  if (days  < 7)   return `${days}日前`
  return new Date(isoStr).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
}

// ─── 基礎練のカテゴリ分類 (音階・アルペジオ・フィンガリング・ボーイング・エチュード) ───
const BASIC_CATEGORY_ORDER = ["scale", "arpeggio", "fingering", "bowing", "etude"] as const
const BASIC_CATEGORY_LABEL: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  fingering: "フィンガリング",
  bowing: "ボーイング",
  etude: "エチュード",
}
function normBasicCat(c: string): string {
  if (c === "scales") return "scale"
  if (c === "arpeggios") return "arpeggio"
  if (c === "etudes") return "etude"
  return c
}

// ─── 旅の地図: 目標曲/Epic Win の常設カード (オンボーディング SCR-12 の続き) ───
function JourneyMapCard({ map }: { map: NonNullable<Props["journeyMap"]> }) {
  const goalDateLabel = map.goalDate
    ? new Date(map.goalDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null
  const songLine = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 20 }}>{map.achieved ? "🏆" : "🎯"}</span>
      <span style={{ fontWeight: 700, color: "#3c3c3c" }}>
        {map.songName}
        <span style={{ marginLeft: 6, fontSize: 12, color: "#8a8a8a", fontWeight: 600 }}>
          ⭐︎{map.songStar}
        </span>
      </span>
      {map.achieved ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#085041",
            background: "#E1F5EE",
            borderRadius: 999,
            padding: "2px 10px",
          }}
        >
          達成済み!
        </span>
      ) : (
        map.periodLabel && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#0C447C",
              background: "#E6F1FB",
              borderRadius: 999,
              padding: "2px 10px",
            }}
          >
            {map.daily ? `毎日${map.daily.replace(" / 日", "")}で` : ""}
            {map.periodLabel}で到達
          </span>
        )
      )}
      {map.songHref && (
        <Link
          href={map.songHref}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            color: "#58CC02",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          楽譜へ ▶
        </Link>
      )}
    </div>
  )
  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>🗺️ 旅の地図</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8a8a", marginBottom: 4 }}>
            目標曲
          </div>
          {songLine}
        </div>
        {map.epicWin && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8a8a", marginBottom: 4 }}>
              大きな夢
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>🌟</span>
              <span style={{ fontWeight: 700, color: "#3c3c3c" }}>{map.epicWin}</span>
              {goalDateLabel && (
                <span style={{ fontSize: 12, color: "#8a8a8a" }}>目標: {goalDateLabel}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type BasicCardItem = Props["basicPracticeCards"][number]

function BasicPracticeCard({ item }: { item: BasicCardItem }) {
  return (
    <Link
      href={item.href}
      style={{
        flex: "0 0 auto",
        width: 150,
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {item.title}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#999" }}>{relativeTime(item.lastPracticedAt)}</span>
        {item.recentScore != null ? (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 8,
              ...scoreColor(item.recentScore),
            }}
          >
            {item.recentScore}
            <span style={{ fontSize: 10, fontWeight: 500 }}>点</span>
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "#bbb" }}>未評価</span>
        )}
      </div>
    </Link>
  )
}

// ─── 今日の練習 (直近の練習曲タブ + 課題アドバイス + 教材リンク) ──────────
function TodayPanel({
  recentPieces,
  nextPieces,
}: {
  recentPieces: Props["recentPieces"]
  nextPieces: SongRecommendation[]
}) {
  const [active, setActive] = useState(0)
  const piece = recentPieces[active] ?? recentPieces[0] ?? null
  // 工程C-6a: 累積弱点API の認可と「練習する →」リンクに URL の userId を使う
  const { userId: urlUserId } = useParams<{ userId: string }>()

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>練習曲の上達状況</div>

      {/* 直近の練習曲: 複数なら横タブ */}
      {recentPieces.length > 0 && (
        <>
          {recentPieces.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              {recentPieces.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  style={{
                    flex: "0 0 auto",
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: active === i ? "#4a90d9" : "#ddd",
                    background: active === i ? "#4a90d9" : "#fff",
                    color: active === i ? "#fff" : "#555",
                    fontSize: 13,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.badge === "mastered" ? "🏆 " : p.badge === "achieved" ? "✨ " : ""}
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {piece && (
            <Link
              href={piece.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: "#f7f9fc",
                textDecoration: "none",
                color: "inherit",
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#888" }}>直近平均スコア</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {piece.title}
                  </span>
                  <MasterBadge kind={piece.badge} />
                </div>
              </div>
              {piece.recentAvg != null ? (
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 22,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 10,
                    ...scoreColor(piece.recentAvg),
                  }}
                >
                  {piece.recentAvg}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>点</span>
                </span>
              ) : (
                <span style={{ flex: "0 0 auto", fontSize: 13, color: "#aaa" }}>未評価</span>
              )}
            </Link>
          )}
        </>
      )}

      {/* 工程C-6a (2026-07-11): 旧「いま〇〇が課題」(UserSkillTaskCard由来) を
          217診断の累積弱点(窓②)に置換。弱点なし/データ不足時は従来どおり
          「次の曲にチャレンジ」を出す */}
      <CumulativeWeaknessPanel
        userId={urlUserId}
        emptyFallback={
          <>
            <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10, color: "#555" }}>
              直近の課題はありません！<br />次の曲にチャレンジしてみよう！
            </div>
            <RecommendationList recommendations={nextPieces} />
          </>
        }
      />
    </div>
  )
}

export default function HomeClient({
  userName: _userName,
  streak,
  weeklyDays,
  arcoMessage,
  gradeData,
  basicPracticeCards,
  recentPieces,
  nextPieceRecommendations,
  journeyMap,
  rankCard,
}: Props) {
  void _userName
  const WEEKLY_GOAL = 5
  const [guideOpen, setGuideOpen] = useState(false)

  // C-6b (2026-07-11): ★昇格は達成ベース (同★10曲達成で次の★へ = spec§1-6)。
  // グレード帯: ★1-3 初級 / ★4-6 中級 / ★7-9 上級 / ★10 マスター
  const hintText = gradeData.isMaster
    ? undefined
    : (() => {
        const star = gradeData.currentStar
        const next = `同じ★の曲を10曲達成すると次の★へ`
        if (star <= 3) return `${next}（★4で中級者）`
        if (star <= 6) return `${next}（★7で上級者）`
        return `${next}（★10でマスター）`
      })()

  return (
    <div className={styles.page}>

      {/* ───── マイランクカード (最上部・タップで演奏の軌跡) ───── */}
      <MyRankCard {...rankCard} />

      {/* ───── アルコちゃんからの案内 ───── */}
      <div className={`${styles.card} ${styles.arcoCard}`} data-onboarding="home.arcoCard">
        <div className={styles.arcoHeader}>
          <div className={styles.arcoHeaderLeft}>
            <span className={styles.arcoIcon}>🎻</span>
            <span className={styles.arcoName}>アルコちゃんからの案内</span>
          </div>
          <div className={styles.arcoStats}>
            <div className={styles.arcoStatItem}>
              <span className={styles.arcoStatLabel}>今週の練習</span>
              <span className={styles.arcoStatValue}>
                {weeklyDays}<span className={styles.arcoStatGoal}>/{WEEKLY_GOAL}日</span>
              </span>
            </div>
            <div className={styles.arcoStatItem}>
              <span className={styles.arcoStatLabel}>🔥 連続練習記録</span>
              <span className={styles.arcoStatValue}>
                {streak}<span className={styles.arcoStatGoal}>日</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.arcoGreeting}>{arcoMessage.greeting}</div>
        <div className={styles.arcoCheer}>{arcoMessage.cheer}</div>

        {/* v1.6 Phase 4-2: グレード/★表示 (UserGradeProgress 準拠、Q3=A 旧 starsByLv 撤去) */}
        <div className={styles.gradeSection}>
          <div className={styles.gradeRow}>
            <GradeBadge
              currentStar={gradeData.currentStar}
              currentGrade={gradeData.currentGrade}
            />
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              aria-label="上達のしくみを見る"
              style={{
                flex: "0 0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #cfe3fb",
                background: "#f0f7ff",
                color: "#4a90d9",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ？上達のしくみ
            </button>
            <div className={styles.gradeProgress}>
              <GradeProgressBar
                current={gradeData.masteredSongCountAtCurrentStar}
                target={gradeData.gradeUpRequired}
                hintText={hintText}
                isMaster={gradeData.isMaster}
                masterReachedAt={gradeData.masterReachedAt}
              />
            </div>
          </div>
        </div>
      </div>

      <ProgressGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* ───── 旅の地図: オンボーディングで決めた目標曲と大きな夢の常設表示 ───── */}
      {journeyMap && <JourneyMapCard map={journeyMap} />}

      {/* ───── 練習曲の上達状況: 直近の練習曲 + 課題アドバイス + 教材リンク ───── */}
      {/* 課題ありの「課題練習」には練習曲(category=score)は出さず、基礎練/エチュードのみ提示。
          練習曲は課題なし時の「次の曲にチャレンジ」(nextPieces) でのみ提示する。 */}
      {/* 工程C-6a: 旧challengeName/challengeMaterials(UserSkillTaskCard由来)は
          TodayPanel 内の累積弱点(窓②)に置換済み */}
      <TodayPanel
        recentPieces={recentPieces}
        nextPieces={nextPieceRecommendations}
      />

      {/* ───── 基礎練習の練習状況: カテゴリ分類 (音階/アルペジオ/フィンガリング/ボーイング/エチュード) ───── */}
      {basicPracticeCards.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>基礎練習の練習状況</div>
          {[
            ...BASIC_CATEGORY_ORDER,
            ...Array.from(
              new Set(
                basicPracticeCards
                  .map((c) => normBasicCat(c.category))
                  .filter((c) => !BASIC_CATEGORY_ORDER.includes(c as (typeof BASIC_CATEGORY_ORDER)[number])),
              ),
            ),
          ].map((cat) => {
            const items = basicPracticeCards.filter((c) => normBasicCat(c.category) === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#555", margin: "6px 0" }}>
                  {BASIC_CATEGORY_LABEL[cat] ?? cat}
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {items.map((item) => (
                    <BasicPracticeCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <OnboardingTrigger pageKey="home" />
    </div>
  )
}
