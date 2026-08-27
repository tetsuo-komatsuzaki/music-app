"use client"

import Link from "next/link"
import { useState, useRef, useEffect, useCallback, useMemo, Component, type ReactNode, type ErrorInfo, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Pencil, Play, Pause, Trash2, Target, PenLine, Maximize2 } from "lucide-react"
import ScoreDetailTabs, { type ScoreDetailTabId } from "@/app/components/ScoreDetailTabs"
import MasterBadge from "@/app/components/MasterBadge"
import FavoriteButton from "@/app/components/FavoriteButton"
import ArcoResultOverlay from "@/app/components/ArcoResultOverlay"
import ScoreLoopDetail from "@/app/components/ScoreLoopDetail"
import AnnotationLayer from "./AnnotationLayer"
import { getFeedbackAsStudent } from "@/app/actions/teacherFeedback"
import type { AnnotationData } from "@/app/_libs/annotationSanitize"
import ShareToTeacherButton from "./ShareToTeacherButton"
import SymbolGuide, { type SymbolGuideHandle } from "./SymbolGuide"
import { extractScoreSymbols, BASIC_READING_SYMBOL_IDS, BASIC_SYMBOL_HIDE_STAR } from "@/app/_libs/scoreSymbols"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import * as Tone from "tone"
import { playNote, preloadFor, releaseViolin } from "@/app/_libs/violinSampler"
import { lockLandscape, unlockOrientation } from "@/app/_libs/arcodaOrientation"
import ProgressTrajectory from "@/app/components/ProgressTrajectory"
import styles from "./scoreDetail.module.css"
import "./ScoreFullscreen.css"
import Recorder, { type Status as RecorderStatus } from "@/app/components/Recorder"
import { buildScrollPlan, locateInPlan, type ScrollPlan } from "@/app/_libs/scoreScroll"
import PerformanceSkeleton from "@/app/components/PerformanceSkeleton"
import PerformanceDeleteModal from "@/app/components/PerformanceDeleteModal"
import PressMenu from "@/app/components/ui/PressMenu"
import { useLongPress, type LongPressPos } from "@/app/_hooks/useLongPress"
import { getSignedUploadUrl } from "@/app/actions/getSignedUploadUrl"
import { renamePerformance } from "@/app/actions/renamePerformance"
import { resolvePartToNoteRange, type Part } from "@/app/_libs/materialParts"
import { CELEBRATION_SINCE_MS } from "@/app/_libs/featureFlags"
import { parseMilestoneEvents } from "@/app/_libs/celebration"
import CelebrationBanner from "@/app/components/CelebrationBanner"
import SinglePerfFingerboard from "@/app/components/SinglePerfFingerboard"
import FingerboardPanel from "@/app/components/FingerboardPanel"
import StudentKarteCards, { type StudentKarteCard } from "@/app/components/StudentKarteCards"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import { getSongHeatmapRange } from "@/app/actions/heatmapActions"
import OnboardingTrigger from "@/app/[userId]/_onboarding/OnboardingTrigger"
import { useOnboarding } from "@/app/[userId]/_onboarding/hooks/useOnboarding"

// =========================================================
// 型定義
// =========================================================

// v1.7 Phase B (2026-05-23): EvaluationStatus は重音/ハーモニクスの新値を含む。
// scoreDetail はまだ新値の専用 UI を持たないが、型としては受け入れる
// (Phase F で表現追加するまで、新値は既存 UI の中立色で描画される)。
import type { EvaluationStatus } from "@/app/types/comparisonResult"

/** v2 正規化済みの比較結果 */
type ComparisonNote = {
  note_index: number
  measure_number: number
  note_name: string
  pitch_ok: boolean | null
  start_ok: boolean | null
  pitch_cents_error: number | null
  start_diff_sec: number | null
  evaluation_status: EvaluationStatus
  detected_pitch_hz: number | null
}

type PerformanceDTO = {
  id: string
  name: string | null
  uploadedAt: string
  status: string
  analysisStatus?: string | null
  audioUrl: string | null
  comparisonResult: any[] | null
  comparisonWarnings?: string[]
  pitchAccuracy?: number | null
  timingAccuracy?: number | null
  evaluatedNotes?: number | null
  /** 先生の返し (演奏へのコメント)。練習後カルテに貼り付け表示 (2026-08-11) */
  teacherComments?: { body: string; teacherName: string }[]
  analysisSummary?: any
  // 区間録音 (部分練習 Phase 2): 非null = 区間演奏。曲の公式スコアには非算入・履歴で「区間」表示。
  rangeFromNote?: number | null
  rangeToNote?: number | null
  // パート分け (2026-07-26): 区間がどの名前付きパートか。パート別 自己ベスト/推移の集計キー。
  partId?: string | null
}

// analysis.json (analyze_musicxml.py) の音符。記号ガイド用のフィールドは
// 以前から書き出されていたが型に載っていなかったため、任意項目として追加 (2026-07-25)。
type AnalysisNote = {
  note_index: number
  measure_number?: number // パート(小節範囲)→音符範囲の解決に使う (2026-07-26)
  type: string
  pitches: number[]
  start_time_sec: number
  end_time_sec: number
  articulations?: string[] | null
  dynamic?: string | null
  is_tied?: boolean | null
  is_tremolo?: boolean | null
  is_trill?: boolean | null
  is_mordent?: boolean | null
  is_chord?: boolean | null
  is_harmonic?: boolean | null
  tuplet_actual?: number | null
  display_finger?: number | null
  display_string_num?: number | null
}

type AnalysisData = {
  bpm: number
  notes: AnalysisNote[]
  key?: { tonic?: string | null; mode?: string | null } | null
  time_signature?: { numerator?: number | null; denominator?: number | null } | null
  spanners?: { slurs?: { start: number; end: number }[] | null } | null
}

type Props = {
  score: { id: string; title: string; badge?: "mastered" | "achieved" | null }
  userId: string
  analysis: AnalysisData | null
  buildUrl: string | null
  /**
   * 解析起動を通知する Server Action (v3.3 spec Commit 3 で型変更)
   * Commit 4 で uploadRecord/uploadPracticeRecord 自体が新シグネチャに変わる予定。
   * 現状は呼び出し側 (page.tsx) でアダプター経由の呼び出しを行う。
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadAction: (params: { performanceId: string; recordingBpm?: number; guideOffsetSec?: number | null; rangeFromNote?: number; rangeToNote?: number; partId?: string }) => Promise<any>
  performanceCount: number
  latestPitchAccuracy: number | null
  /** ユーザーのランク (currentStar)。★4+ では基礎の読譜記号の説明を省く (2026-08-10) */
  currentStar?: number
  infoSlot?: React.ReactNode
  /** practice用: score-performancesの代わりにpractice-performancesを使う */
  practiceItemId?: string
  /** お気に入り初期状態 (曲/教材) */
  initialFavorite?: boolean
  /** 教材詳細 (score-15 ITEM ・ 2026-08-22 写経): 戻り先とヘッダ固有部 */
  backHref?: string
  backLabel?: string
  /** 原本 .subT: 「スラー ・ ☆3」など (奏法 ・ 星) */
  subTitle?: string | null
  /** 原本 pill gold「クリア」 */
  cleared?: boolean
  /** 原本「アヴェ・マリアにもどる」カード (学びポイント経由) */
  fromScore?: { id: string; title: string } | null
  /** パート分け (2026-07-26): 曲(グループ)共通のパート範囲リスト。空=分割なし(通しのみ) */
  parts?: Part[]
  /** 練習後カルテ (2026-08-11 案A): カルテごとに癖・旗・表現をセットで表示 */
  teacherKartes?: StudentKarteCard[]
  /** 指板の実測塗り用: note_index → 指板セル+ポジション (musicxml_skill_info 由来・2026-08-11) */
  fingerNotes?: Record<number, { s: "G" | "D" | "A" | "E"; n: number; p?: number | null }>
  /** ふりかえりタブ「上達のようす」直下: この曲の全演奏合算の音程マップ (2026-08-11) */
  songHeatmap?: HeatmapData | null
}

// =========================================================
// v1 → v2 正規化
// =========================================================

function normalizeComparison(raw: any[] | null): ComparisonNote[] | null {
  if (!raw || raw.length === 0) return null
  return raw.map((r) => ({
    note_index: r.note_index ?? 0,
    measure_number: r.measure_number ?? 0,
    note_name: r.note_name ?? "",
    pitch_ok: r.pitch_ok ?? null,
    start_ok: r.start_ok ?? null,
    pitch_cents_error: r.pitch_cents_error ?? null,
    start_diff_sec: r.start_diff_sec ?? null,
    evaluation_status: r.evaluation_status ?? "evaluated",
    detected_pitch_hz: r.detected_pitch_hz ?? null,
  }))
}

// =========================================================
// 色判定
// =========================================================

// 原本 s04 №04 の凡例色 (クリーム紙用の深色 ・ 記録の分析の枝色と同族):
// 正確=#2E7D5B ・ 音程ずれ=#D97B2E ・ 聞きとれず=#B44B4B。
// タイミングずれは原本凡例に無い第4分類 → リズム軸(teal)の深色で区別
const COLOR_GREEN = "#2E7D5B"
const COLOR_ORANGE = "#2F8A8A"
const COLOR_RED = "#D97B2E"
const COLOR_GREY = "#B44B4B"
const HIGHLIGHT_COLOR = "#2266ff"

function getComparisonColor(r: ComparisonNote): string {
  // v1.7 Phase F: spectral_inconclusive (信号弱で判定保留) は赤判定にせず灰へ
  if (r.evaluation_status === "spectral_inconclusive") return COLOR_GREY
  if (r.evaluation_status === "not_evaluated" || r.evaluation_status === "section_missing" || r.evaluation_status === "not_detected") {
    return COLOR_GREY
  }
  // v1.7 Phase F: △ (重音部分一致 / ハーモニクス普通音色化) は橙 = 改善ポイント
  if (r.evaluation_status === "double_stop_partial" ||
      r.evaluation_status === "harmonic_normal_tone") return COLOR_ORANGE
  if (r.pitch_ok === false) return COLOR_RED
  if (r.evaluation_status === "evaluated" && r.start_ok === false) return COLOR_ORANGE
  return COLOR_GREEN
}

// =========================================================
// 間違い音符オーバーレイ + ポップオーバー用ヘルパー
// =========================================================

/** Hz → 音名・例: 277.2 → "C#4" */
function hzToNoteName(hz: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const midi = Math.round(12 * Math.log2(hz / 440) + 69)
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`
}

/** cents差 → 自然言語 */
function centsToLabel(cents: number): string {
  const abs = Math.abs(cents)
  const dir = cents > 0 ? "高い" : "低い"
  if (abs <= 15) return "ほぼ正確"
  if (abs <= 50) return `少し${dir}`
  if (abs <= 80) return dir
  if (abs <= 150) return `半音${dir}`
  return "大きくずれている"
}

// (間違い音符オーバーレイのヘルパー群は 2026-08-06 廃止で削除)



// =========================================================
// スコアランク + フィードバック
// =========================================================

type ScoreRank = "excellent" | "good" | "ok" | "needsPractice"

function getScoreRank(score: number): ScoreRank {
  if (score >= 90) return "excellent"
  if (score >= 75) return "good"
  if (score >= 60) return "ok"
  return "needsPractice"
}

const rankLabels: Record<ScoreRank, { label: string; color: string; bg: string }> = {
  excellent:     { label: "ばっちり",   color: "var(--text-good)", bg: "#E1F5EE" },
  good:          { label: "いい調子",   color: "var(--text-link)", bg: "#E6F1FB" },
  ok:            { label: "あと少し",   color: "var(--text-master)", bg: "#FAEEDA" },
  needsPractice: { label: "練習しよう", color: "var(--text-error)", bg: "#FCEBEB" },
}

// 演奏スコア = 音程・リズム正確率の平均。総合点(overallScore)廃止に伴う曲の代表点。
// (2026-06-07 設計確定: 曲の評価は音程+リズム、課題クリアは別軸)
function performanceScore(p: { pitchAccuracy?: number | null; timingAccuracy?: number | null }): number | null {
  if (p.pitchAccuracy == null || p.timingAccuracy == null) return null
  return Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
}

// =========================================================
// 評価サマリー（DB値をそのまま表示）
// =========================================================

// =========================================================
// SVGノート操作ヘルパー
// =========================================================

const ORIG_FILL = "origFill"
const ORIG_STROKE = "origStroke"

function colorizeNote(el: Element, color: string) {
  el.querySelectorAll("path").forEach((path) => {
    const fill = path.dataset[ORIG_FILL]
    if (fill && fill !== "none") path.setAttribute("fill", color)
    const stroke = path.dataset[ORIG_STROKE]
    if (stroke && stroke !== "none") path.setAttribute("stroke", color)
  })
}

function restoreNote(el: Element) {
  el.querySelectorAll("path").forEach((path) => {
    const f = path.dataset[ORIG_FILL]
    const s = path.dataset[ORIG_STROKE]
    if (f !== undefined) path.setAttribute("fill", f)
    if (s !== undefined) path.setAttribute("stroke", s)
  })
}

function saveOriginalColors(el: Element) {
  el.querySelectorAll("path").forEach((path) => {
    if (path.dataset[ORIG_FILL] === undefined) {
      path.dataset[ORIG_FILL] = path.getAttribute("fill") || ""
      path.dataset[ORIG_STROKE] = path.getAttribute("stroke") || ""
    }
  })
}

// =========================================================
// サブコンポーネント: NotePopoverContent
// =========================================================

function NotePopoverContent({ note }: { note: ComparisonNote }) {
  if (note.evaluation_status === "not_detected") {
    return <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700 }}>この音は聞きとれなかったよ</div>
  }
  if (note.evaluation_status === "not_evaluated" || note.evaluation_status === "section_missing") {
    return <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700 }}>採点なし</div>
  }
  const expected = note.note_name
  const detected = note.detected_pitch_hz ? hzToNoteName(note.detected_pitch_hz) : null
  return (
    <>
      <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700, marginBottom: 4 }}>
        {note.pitch_ok
          ? `${expected} 正確`
          : `${expected} → ${detected ?? "?"}`}
      </div>
      <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.6 }}>
        {note.pitch_cents_error != null && !note.pitch_ok && (
          <div>
            {centsToLabel(note.pitch_cents_error)}・{note.pitch_cents_error > 0 ? "+" : ""}
            {Math.round(note.pitch_cents_error)} cents
          </div>
        )}
        {note.evaluation_status === "evaluated" && note.start_diff_sec != null && (
          <div>
            タイミング:{" "}
            {note.start_ok
              ? "正確"
              : `${note.start_diff_sec > 0 ? "+" : ""}${note.start_diff_sec.toFixed(2)}秒`}
          </div>
        )}
      </div>
    </>
  )
}

// =========================================================
// サブコンポーネント: EvaluationSummaryCard
// =========================================================

function EvaluationSummaryCard({
  performance,
  warnings,
}: {
  performance: PerformanceDTO
  warnings: string[]
}) {
  const totalNotes = Array.isArray(performance.comparisonResult) ? performance.comparisonResult.length : null
  const showEval = performance.evaluatedNotes != null

  // 音程/タイミング正確率と点数は畳んだ演奏履歴カードで表示済みのため、
  // ここは「評価対象 ○/○ ノート」だけを小さく残す (2026-08-01 Tetsuo)。
  if (!showEval && warnings.length === 0) return null

  return (
    <div>
      {showEval && (
        <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 600 }}>
          採点した音 {performance.evaluatedNotes}{totalNotes != null ? ` / ${totalNotes}` : ""}
        </div>
      )}
      {warnings.length > 0 && (
        <div className={styles.evalWarnings} style={{ marginTop: showEval ? 8 : 0 }}>
          {warnings.map((w, i) => (
            <div key={i} className={styles.evalWarning}>{w}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// =========================================================
// サブコンポーネント: PerformanceHistory
// =========================================================

const PERFORMANCE_NAME_MAX = 10

// 演奏履歴の点数ピルの配色 (再設計 2026-08-09)。ブランド配色に準拠し、
// 低得点でも「赤=エラー」を出さない: 低=グレー / 通常=藍(世界観) / 好=緑 / 90+=金(マスター域)。
function scoreTone(s: number): { ink: string; bg: string } {
  if (s >= 90) return { ink: "#8a5a1f", bg: "#fbf3e3" }
  if (s >= 75) return { ink: "#2e8b57", bg: "#e9f6ee" }
  if (s >= 50) return { ink: "#2b5bc4", bg: "#eef2fb" }
  return { ink: "#64748b", bg: "#f1f4f8" }
}

function PerformanceHistory({
  performances,
  selectedId,
  onSelect,
  loading,
  performanceCount,
  kind,
  onRenamed,
  renderDetail,
  onReplayArco,
  canShareToTeacher,
  renderRowMenu,
  onPerformanceDeleted,
}: {
  performances: PerformanceDTO[]
  selectedId: string | null
  onSelect: (p: PerformanceDTO) => void
  loading: boolean
  performanceCount: number
  kind: "score" | "practice"
  onRenamed: (performanceId: string, newName: string) => void
  /** 開いたカード内に収納する評価詳細 (得点内訳 / 判定内容) を描画する */
  renderDetail?: (p: PerformanceDTO) => React.ReactNode
  /** アルコ結果オーバーレイを再表示する (スコアモードのみ) */
  onReplayArco?: (p: PerformanceDTO) => void
  /** D: 先生あり生徒のとき、各録音に「先生に共有」ボタンを出す */
  canShareToTeacher?: boolean
  /** 結果カード右上に置く操作 (削除など) */
  renderRowMenu?: (p: PerformanceDTO) => React.ReactNode
  /** 長押しメニューの「削除」で使う削除完了ハンドラ */
  onPerformanceDeleted?: (performanceId: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // 畳んでいても押せる再生: カード共通の <audio> を1つ持ち、再生中の演奏IDを持つ
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const togglePlay = (p: PerformanceDTO, e: React.MouseEvent) => {
    e.stopPropagation()
    const a = audioRef.current
    if (!a || !p.audioUrl) return
    if (playingId === p.id) { a.pause(); setPlayingId(null); return }
    a.src = p.audioUrl
    a.play().then(() => setPlayingId(p.id)).catch(() => setPlayingId(null))
  }

  // 最新1枚は常に表示し、それ以外は「すべての演奏を見る」アコーディオンに畳む (2026-08-09)
  const latest = performances[0]
  const rest = performances.slice(1)
  // 原本 hist_row の「ベスト」タグ: 通し演奏の最高点
  const bestId = (() => {
    let id: string | null = null, best = -1
    for (const p of performances) {
      if (p.rangeFromNote != null) continue
      const sc = performanceScore(p)
      if (sc != null && sc > best) { best = sc; id = p.id }
    }
    return id
  })()

  const beginRename = (p: PerformanceDTO) => {
    setEditingId(p.id)
    setDraftName(p.name ?? "")
    setSaveError(null)
  }
  const startEdit = (p: PerformanceDTO, e: React.MouseEvent) => {
    e.stopPropagation()
    beginRename(p)
  }

  // (1) 長押しメニュー: カードを長押しで「名前を変更 / 削除」。既存タップは維持する。
  const [pressMenu, setPressMenu] = useState<{ p: PerformanceDTO; pos: LongPressPos } | null>(null)
  const [deleteFor, setDeleteFor] = useState<PerformanceDTO | null>(null)
  const longPress = useLongPress<PerformanceDTO>((p, pos) => setPressMenu({ p, pos }))

  const cancelEdit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    setEditingId(null)
    setDraftName("")
    setSaveError(null)
  }

  const submitEdit = async (performanceId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    if (saving) return
    setSaving(true)
    setSaveError(null)
    const res = await renamePerformance({ performanceId, kind, name: draftName })
    setSaving(false)
    if (!res.ok) {
      setSaveError(res.error)
      return
    }
    onRenamed(performanceId, res.name)
    setEditingId(null)
    setDraftName("")
  }

  // 1件分のカード (最新1枚・アコーディオン内の両方で使う)
  const renderItem = (p: PerformanceDTO) => {
    const isEditing = editingId === p.id
    const dateLabel = new Date(p.uploadedAt).toLocaleDateString("ja-JP")
    // 既定名は録音回数の連番 "#N"。旧既定名 "Performance #N" も表示時に "#N" へ変換
    const nameMatch = /^Performance #?(\d+)$/i.exec(p.name ?? "")
    const displayName = nameMatch ? `#${nameMatch[1]}` : (p.name ?? "録音")
    const score = performanceScore(p)
    const tone = score != null ? scoreTone(score) : null
    const statusLabel =
      score != null
        ? `${score}点`
        : p.analysisStatus === "error"
          ? "採点できなかったよ"
          : p.analysisStatus === "done"
            ? "採点ずみ"
            : "採点中…"
    const showEvalBadge = p.comparisonResult || p.pitchAccuracy != null

    return (
      <div
        key={p.id}
        className={`${styles.htlFeat} ${selectedId === p.id ? styles.historyActive : ""} pressable`}
        onClick={() => { if (longPress.suppressNextClick()) return; if (!isEditing) onSelect(p) }}
        {...longPress.bind(p)}
      >
        {isEditing ? (
          /* 名前編集: 白カードのインライン入力 (名前タップで入る) */
          <div className={styles.histMain}>
            <div className={styles.histMid}>
              <div className={styles.histEditRow}>
                <input
                  type="text"
                  value={draftName}
                  maxLength={PERFORMANCE_NAME_MAX}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEdit(p.id, e)
                    else if (e.key === "Escape") cancelEdit(e)
                  }}
                  className={styles.historyNameInput}
                  disabled={saving}
                />
                <button type="button" className={styles.historyActionBtn} onClick={(e) => submitEdit(p.id, e)} disabled={saving} aria-label="保存">{saving ? "..." : "保存"}</button>
                <button type="button" className={styles.historyActionBtn} onClick={cancelEdit} disabled={saving} aria-label="キャンセル">取消</button>
              </div>
              {saveError && <div className={styles.historyError}>{saveError}</div>}
            </div>
          </div>
        ) : (
          /* 全カード均一 (案01): 左に再生 → 名前/バー → 点数ピル → 開閉。名前タップで編集 */
          <div className={styles.histMain}>
            {p.audioUrl && (
              <button
                type="button"
                className={styles.histPlay}
                onClick={(e) => togglePlay(p, e)}
                aria-label={playingId === p.id ? "一時停止" : "この演奏を聴く"}
              >
                {playingId === p.id ? <Pause size={11} fill="#fff" /> : <Play size={11} fill="#fff" style={{ marginLeft: 1 }} />}
              </button>
            )}
            <div className={styles.histMid}>
              <div className={styles.histTop}>
                <span className={styles.histNameWrap} onClick={(e) => startEdit(p, e)} title="タップで名前を変更">
                  <span className={styles.historyName}>{displayName}</span>
                  <Pencil size={11} aria-hidden className={styles.histNameEditIcon} />
                </span>
                {p.rangeFromNote != null && (
                  <span className={styles.rangeTag} title="区間だけを録音した部分練習">区間</span>
                )}
                {p.id === bestId && <span className={styles.histBestTag}>ベスト</span>}
                <span className={styles.historyDate}>{dateLabel} ・ 最新</span>
              </div>
              {score != null ? (
                <div className={styles.histSubs}>
                  <div className={styles.histBar}>
                    <span className={styles.histDot} style={{ background: "#2b5bc4" }} />
                    <span className={styles.histMiniLabel}>音程</span>
                    <span className={styles.histBarTrack}>
                      <span className={styles.histBarFill} style={{ width: `${Math.round(p.pitchAccuracy!)}%`, background: "#2b5bc4" }} />
                    </span>
                    <b className={styles.histBarVal}>{Math.round(p.pitchAccuracy!)}</b>
                  </div>
                  <div className={styles.histBar}>
                    <span className={styles.histDot} style={{ background: "#e6a94a" }} />
                    <span className={styles.histMiniLabel}>リズム</span>
                    <span className={styles.histBarTrack}>
                      <span className={styles.histBarFill} style={{ width: `${Math.round(p.timingAccuracy!)}%`, background: "#e6a94a" }} />
                    </span>
                    <b className={styles.histBarVal}>{Math.round(p.timingAccuracy!)}</b>
                  </div>
                </div>
              ) : (
                <div className={styles.histStatusRow}>
                  <span>{statusLabel}</span>
                  {showEvalBadge && <span className={styles.historyBadge}>採点ずみ</span>}
                </div>
              )}
            </div>
            {score != null && tone && (
              <span className={styles.htlScoreBig}>{score}<small>点</small></span>
            )}
            <span aria-hidden className={styles.histChev}>{selectedId === p.id ? "▲" : "▼"}</span>
          </div>
        )}
        {/* 演奏へのコメント表示は廃止 (2026-08-11 Tetsuo確定): 先生の返しは曲にぶら下がる練習後カルテに一本化 */}
        {/* アコーディオン展開 = アルコの採点「結果カード」。削除は右上に。 */}
        {!isEditing && selectedId === p.id && (
          <div className={styles.histResult} onClick={(e) => e.stopPropagation()}>
            <div className={styles.histResultHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Icon.png" alt="" aria-hidden width={18} height={18} style={{ borderRadius: 4, flex: "none" }} />
              <b>アルコの採点</b>
              {renderRowMenu && <span className={styles.histResultMenu}>{renderRowMenu(p)}</span>}
            </div>
            <div className={styles.histResultBody}>
              {renderDetail && renderDetail(p)}
              {((score != null && onReplayArco) || canShareToTeacher) && (
                <div className={styles.histDetailActions}>
                  {score != null && onReplayArco && (
                    <button
                      type="button"
                      className={styles.historyActionBtn}
                      onClick={(e) => { e.stopPropagation(); onReplayArco(p) }}
                      title="アルコの結果をもう一度"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/Icon.png" alt="" aria-hidden width={13} height={13} style={{ borderRadius: 3, verticalAlign: "-2px", marginRight: 4 }} />結果をもう一度
                    </button>
                  )}
                  {canShareToTeacher && (
                    <ShareToTeacherButton performanceId={p.id} kind={kind} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.card} style={{ padding: "13px 15px" }}>
      <h3 className={styles.histHead}>演奏履歴 ・ {performanceCount}回</h3>
      {/* カード共通の再生用 audio (畳んでいても再生ボタンから鳴らせる) */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
      {loading ? (
        <PerformanceSkeleton count={Math.min(performanceCount, 5)} />
      ) : performances.length === 0 ? (
        <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>まだ演奏がないよ。録音してみよう！</div>
      ) : (
        <>
          {/* 最新の1枚は常に表示 */}
          {latest && renderItem(latest)}
        </>
      )}

      {/* (1) 長押しメニュー */}
      {pressMenu && (
        <PressMenu
          anchor={pressMenu.pos}
          onClose={() => setPressMenu(null)}
          items={[
            { label: "名前を変更", icon: Pencil, onSelect: () => beginRename(pressMenu.p) },
            { label: "削除", icon: Trash2, danger: true, onSelect: () => setDeleteFor(pressMenu.p) },
          ]}
        />
      )}
      {deleteFor && (
        <PerformanceDeleteModal
          performanceId={deleteFor.id}
          open={true}
          kind={kind}
          onClose={() => setDeleteFor(null)}
          onDeleted={(id) => { onPerformanceDeleted?.(id); setDeleteFor(null) }}
        />
      )}
    </div>
  )
}

// =========================================================
// サブコンポーネント: ScoreViewer（OSMDインスタンスを親に公開）
// =========================================================

// コンテナ幅に応じた OSMD zoom 値を返す。
// 2026-08-15 スマホの譜面が小さすぎる指摘(アプリ実機)で狭幅の倍率を引き上げ。
// 1行あたりの小節数は減るが、音符の判読性を優先する。
function computeResponsiveZoom(containerWidth: number): number {
  if (containerWidth < 400) return 0.62
  if (containerWidth < 700) return 0.7
  if (containerWidth < 1000) return 0.78
  return 0.85
}

// 9a帯モード: 「画面幅に約5小節」を狙って倍率を合わせる (2026-08-15 Tetsuo指定)。
// 現在の描画から1小節あたりの幅を実測し、目標小節数から逆算する。
const BAND_MEASURES_PER_SCREEN = 5
function applyBandZoom(osmd: OpenSheetMusicDisplay, container: HTMLElement) {
  const svg = container.querySelector("svg")
  // 小節数は楽譜データの SourceMeasures が正 (GraphicSheet.MeasureList は次元が曖昧で
  // 1を返すことがあり、平均小節幅が過大→下限0.8倍に張り付くバグの原因だった)
  const measureCount = osmd.Sheet?.SourceMeasures?.length ?? 0
  if (!svg || measureCount === 0) return
  const currentZoom = osmd.zoom || 1
  const avgMeasureWidthAtZoom1 = svg.getBoundingClientRect().width / currentZoom / measureCount
  if (!isFinite(avgMeasureWidthAtZoom1) || avgMeasureWidthAtZoom1 <= 0) return
  const target = Math.min(4.0, Math.max(0.8, container.clientWidth / (BAND_MEASURES_PER_SCREEN * avgMeasureWidthAtZoom1)))
  if (Math.abs(target - currentZoom) > 0.02) {
    osmd.zoom = target
    osmd.render()
  }
}

function ScoreViewer({
  buildUrl,
  onNoteElementsReady,
  onOsmdReady,
  onScoreClick,
  onPageChange,
  forceExpand,
  expandMode,
  onToggleExpand,
  bandMode,
  onBandReady,
  freezeLayout,
}: {
  buildUrl: string | null
  onNoteElementsReady: (elements: Element[]) => void
  onOsmdReady: (osmd: OpenSheetMusicDisplay) => void
  onScoreClick?: (e: React.MouseEvent) => void
  onPageChange?: () => void
  /** 録音中(フルスクリーン)は畳みを解除して全譜面を出す。auto-scrollが4段で切れるのを防ぐ (2026-08-10) */
  forceExpand?: boolean
  /** 拡大ビュー (2026-08-15): 縦のまま譜面だけの全画面。CSSは body[data-score-expand] で制御 */
  expandMode?: boolean
  onToggleExpand?: () => void
  /** 9a帯モード: 録音中のみ折り返し無しの1本帯で描画 (横画面録音モード) */
  bandMode?: boolean
  /** 帯モードの描画が完了した合図。カウントダウン開始を待たせるために使う (2026-08-26) */
  onBandReady?: () => void
  /** カウントダウン〜録音中は true。この間、譜面の組み直しを一切させない (2026-08-26)。
      録音中に組み直すと音符の位置が動き、テンポガイドが固まって飛ぶ。 */
  freezeLayout?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  // 長い譜面は既定で 4 段までに畳む (アコーディオン)。全部見るで展開。
  const [scoreExpanded, setScoreExpanded] = useState(false)
  const [collapsedH, setCollapsedH] = useState<number | null>(null)
  const onScoreClickRef = useRef(onScoreClick)
  onScoreClickRef.current = onScoreClick
  const osmdInstanceRef = useRef<OpenSheetMusicDisplay | null>(null)

  const showPage = useCallback((container: HTMLElement, pageIndex: number) => {
    // OSMD SVGバックエンドはページごとに直下 <svg> を1つ作る（系列SVGはその内部にネスト）
    const directChildren = Array.from(container.children)
    if (directChildren.length > 1) {
      directChildren.forEach((el, index) => {
        (el as HTMLElement).style.display = index === pageIndex ? "" : "none"
      })
    }
    // 直下要素が1つ（1ページ）の場合は何もしない
    setCurrentPage(pageIndex)
  }, [])

  const onNoteElementsReadyRef = useRef(onNoteElementsReady)
  onNoteElementsReadyRef.current = onNoteElementsReady
  const onOsmdReadyRef = useRef(onOsmdReady)
  onOsmdReadyRef.current = onOsmdReady
  const onBandReadyRef = useRef(onBandReady)
  onBandReadyRef.current = onBandReady

  useEffect(() => {
    if (!buildUrl) return
    const container = document.getElementById("osmd-container")
    if (!container) return
    container.innerHTML = ""
    setError(null)

    const osmd = new OpenSheetMusicDisplay(container, {
      // 2026-08-26: 帯モード中は OSMD 自身のリサイズ再描画を止める。
      // アプリ側の handleResize が applyBandZoom を呼ぶため二重に走り、録音中の
      // 再描画でテンポガイドが固まる原因になっていた。
      // (OSMD 1.9 の resize ハンドラは先頭で AutoResizeEnabled を見ることを実装で確認済み。
      //  リポジトリの旧コメント「ハンドラ内で参照されない」は、このバージョンには当たらない)
      autoResize: !bandMode,
      backend: "svg",
      // 1行1小節問題の対処 (2026-08-16): 音符密度の高い曲で行に1小節しか入らない事象を
      // コンパクト描画で解消。実曲6曲の実測で「1小節行」20→1に激減・音符サイズは不変
      // (docs/native-app-9a-implementation-plan.md 手法: Playwright+OSMD単体で変種比較)
      drawingParameters: "compacttight",
      drawTitle: false,
      drawPartNames: false,
      pageFormat: "Endless",
      newPageFromXML: false,
      // 9a帯モード (bandMode=録音時のみ) だけが1本帯を有効化する
      renderSingleHorizontalStaffline: bandMode ?? false,
      // 帯モード: クレジット文字と上下余白を消し、SVG高さ≈五線高さにする (縦中央配置の精度)
      ...(bandMode ? { drawComposer: false, drawCredits: false, drawLyricist: false } : {}),
      pageBackgroundColor: "#ffffff",
      followCursor: false,
    })
    if (bandMode) {
      // 帯モード: ページ上下余白を最小化 (SVG高さを五線に寄せて縦中央配置を正確に)
      osmd.EngravingRules.PageTopMargin = 1
      osmd.EngravingRules.PageBottomMargin = 1
    }


    const collectElements = () => {
      const stavenotes = container.querySelectorAll("g.vf-stavenote")
      const elements = Array.from(stavenotes)
      elements.forEach(saveOriginalColors)
      onNoteElementsReadyRef.current(elements)
      onOsmdReadyRef.current(osmd)
      const pageCount = osmd.GraphicSheet?.MusicPages?.length ?? 1
      setTotalPages(pageCount)
      // 4段(system)を超える長い譜面のみ、4段ぶんの高さで畳む
      const systems = osmd.GraphicSheet?.MusicPages?.[0]?.MusicSystems ?? []
      const svg = container.querySelector("svg")
      if (svg && systems.length > 4) {
        const totalH = svg.getBoundingClientRect().height
        setCollapsedH(Math.round((totalH / systems.length) * 4) + 14)
      } else {
        setCollapsedH(null)
      }
    }

    // autoResize: true のとき OSMD はリサイズ時に内部で render() を呼び SVG を再生成する。
    // MutationObserver で直下子要素の変化を検知し、色の再適用をトリガーする。
    let mutationTimer: ReturnType<typeof setTimeout> | null = null
    const mutationObserver = new MutationObserver(() => {
      if (mutationTimer) clearTimeout(mutationTimer)
      mutationTimer = setTimeout(() => {
        collectElements()
      }, 150)
    })

    osmdInstanceRef.current = osmd

    osmd
      .load(buildUrl)
      .then(() => {
        osmd.zoom = bandMode ? 1.0 : computeResponsiveZoom(container.clientWidth)
            osmd.render()
        // 帯モード: 実測にもとづき「画面幅≈5小節」へ倍率を合わせて再render
        if (bandMode) applyBandZoom(osmd, container)

        setCurrentPage(0)
        showPage(container, 0)
        collectElements()
        // 帯モードの組み直しが終わった合図。呼び出し側はこれを待ってカウントダウンを始める
        if (bandMode) onBandReadyRef.current?.()

        // 初回 render() 完了後に監視開始（render()中の変化は拾わない）
        mutationObserver.observe(container, { childList: true })
      })
      .catch((e: unknown) => {
        console.error("OSMD load error:", e)
        setError("楽譜を表示できませんでした。再読み込みをお試しください。")
      })

    return () => {
      mutationObserver.disconnect()
      if (mutationTimer) clearTimeout(mutationTimer)
      // 重要 (9a真因調査 2026-08-15): OSMDのresizeハンドラは自身のgraphicが存在する限り
      // 旧インスタンスでも再描画を実行する (autoResizeEnabledフラグはハンドラ内で参照されない
      // ことをソースで確認)。clear()でgraphicを破棄し、置き換え後の再描画暴発を封じる。
      try { osmd.clear() } catch { /* noop */ }
      osmdInstanceRef.current = null
    }
  }, [buildUrl, showPage, bandMode])

  // ウィンドウ幅変化に追従して zoom を再計算する。
  // 端末回転や PC でのウィンドウリサイズに対応。OSMD の autoResize は描画幅追従のみで
  // zoom 値は変えないため、ここで明示的に zoom を切り替える。
  const freezeRef = useRef(false)
  freezeRef.current = !!freezeLayout
  // 凍結中は OSMD 自身のリサイズ再描画も止める (帯モードかどうかに関わらず)
  useEffect(() => {
    const osmd = osmdInstanceRef.current
    if (!osmd) return
    try { osmd.AutoResizeEnabled = !freezeLayout } catch { /* noop */ }
  }, [freezeLayout])
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const handleResize = () => {
      // 録音中は幅が変わっても組み直さない。ここが 2026-08-26 の修正で塞ぎ忘れていた穴。
      if (freezeRef.current) return
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (freezeRef.current) return
        const osmd = osmdInstanceRef.current
        const container = document.getElementById("osmd-container")
        if (!osmd || !container) return
        if (bandMode) {
          applyBandZoom(osmd, container)
          return
        }
        const newZoom = computeResponsiveZoom(container.clientWidth)
        if (Math.abs(newZoom - osmd.zoom) < 1e-6) return
        osmd.zoom = newZoom
            osmd.render()
      }, 200)
    }
    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [bandMode])

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages) return
    const container = document.getElementById("osmd-container")
    if (container) {
      showPage(container, page)
      onPageChange?.()
    }
  }

  if (!buildUrl) {
    return (
      <div className={styles.card}>
        <h3>楽譜</h3>
        <div className={styles.scoreMock}><div>まだ採点してないよ</div></div>
      </div>
    )
  }

  return (
    <div className={styles.card} data-score-card>
      {expandMode && (
        <div data-section="expand-bar">
          <span>楽譜</span>
          <button type="button" onClick={onToggleExpand}>とじる</button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} data-expand-header>
        <h3 style={{ margin: 0 }}>楽譜</h3>
        {onToggleExpand && !expandMode && (
          <button
            type="button"
            onClick={onToggleExpand}
            data-expand-btn
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              border: "none", borderRadius: 999,
              background: "rgba(150,175,225,.12)", color: "var(--text-ink)",
              fontSize: 11, fontWeight: 800, padding: "4px 11px", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Maximize2 size={14} />ひろげる
          </button>
        )}
      </div>
      <div className={styles.scoreMock}>
        {error ? (
          <div style={{ color: "var(--text-error)", padding: "20px 0" }}>{error}</div>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <div
                id="osmd-container"
                className={styles.osmdContainer}
                onClick={(e) => onScoreClickRef.current?.(e)}
                style={{ cursor: "pointer", ...(!scoreExpanded && collapsedH != null && !forceExpand ? { maxHeight: collapsedH, overflowY: "hidden" } : {}) }}
              />
              {!scoreExpanded && collapsedH != null && !forceExpand && (
                <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 48, background: "linear-gradient(transparent,#fff 82%)", pointerEvents: "none", borderRadius: "0 0 12px 12px" }} />
              )}
            </div>
            {collapsedH != null && !forceExpand && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setScoreExpanded((v) => !v)}
                  style={{ fontSize: 11.5, fontWeight: 800, color: "#7fa4e8", background: "rgba(150,175,225,.12)", border: "none", borderRadius: 999, padding: "7px 18px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {scoreExpanded ? "折りたたむ ▲" : "全部見る ▼"}
                </button>
              </div>
            )}
            {totalPages > 1 && (
              <div className={styles.scoreNav}>
                <button disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
                  前へ
                </button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button disabled={currentPage === totalPages - 1} onClick={() => goToPage(currentPage + 1)}>
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// =========================================================
// サブコンポーネント: RowDeleteButton
// 演奏履歴カード右上の「削除」ラベル (旧 ⋯ メニューを置き換え・2026-08-09)。
// PerformanceDeleteModal を直接開く。
// =========================================================

function RowDeleteButton({
  performanceId,
  kind,
  onDeleted,
}: {
  performanceId: string
  kind: "score" | "practice"
  onDeleted: (performanceId: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        aria-label="この録音を削除"
        style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", color: "#cdd9f2", fontSize: "var(--fs-label)", fontWeight: 800, padding: 2 }}
      >
        <Trash2 size={12} /> 削除
      </button>
      <PerformanceDeleteModal
        performanceId={performanceId}
        open={open}
        onClose={() => setOpen(false)}
        onDeleted={onDeleted}
        kind={kind}
      />
    </>
  )
}

// スコア(譜面)下に置く判定カラーの凡例
function ScoreLegend() {
  return (
    <div className={styles.evalLegend}>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_GREEN }} /> 正確</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_ORANGE }} /> タイミングずれ</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_RED }} /> 音程ずれ</span>
      <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: COLOR_GREY }} /> 聞きとれず</span>
    </div>
  )
}

// =========================================================
// クラッシュ封じ込め境界 (2026-08-02)
// 録音→解析の遷移で稀に React removeChild (NotFoundError) が起き、従来は
// 画面全体が落ちて手動リロードが必要だった。真因は未特定 (命令的DOM群は
// すべて自己管理ノードで、静的解析ではReact管理ノードを消す箇所が見つからない)。
// ここで捕まえて (1) コンポーネントスタックを console と sessionStorage に保存し、
// (2) スコア画面だけを自動再マウントして復旧する。スタックが取れたら真因を修正する。
// =========================================================

class ScoreCrashBoundary extends Component<{ children: ReactNode }, { epoch: number }> {
  state = { epoch: 0 }
  static getDerivedStateFromError() { return {} } // 再renderを起こす (remountはepochで)
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[score-crash]", error?.name, error?.message, info?.componentStack)
    try {
      sessionStorage.setItem("scoreCrashLast", JSON.stringify({
        name: error?.name, message: String(error?.message ?? "").slice(0, 300),
        componentStack: String(info?.componentStack ?? "").slice(0, 3000),
        at: new Date().toISOString(),
      }))
    } catch { /* storage不可でも復旧は続行 */ }
    this.setState((s) => ({ epoch: s.epoch + 1 }))
  }
  render() {
    if (this.state.epoch >= 3) {
      // 自動復旧が連続で失敗 → 無限ループを避けて手動リロードを案内
      return (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, marginBottom: 8 }}>画面の表示に問題が起きました</div>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginBottom: 14 }}>録音データは保存されています。ページを再読み込みしてください。</div>
          <button type="button" onClick={() => window.location.reload()}
            style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#2b3742", border: "none", borderRadius: 9, padding: "10px 22px", cursor: "pointer" }}>
            再読み込み
          </button>
        </div>
      )
    }
    return <div key={this.state.epoch} style={{ display: "contents" }}>{this.props.children}</div>
  }
}

export default function ScoreDetail(props: Props) {
  return (
    <ScoreCrashBoundary>
      <ScoreDetailInner {...props} />
    </ScoreCrashBoundary>
  )
}

// =========================================================
// メインコンポーネント
// =========================================================

function ScoreDetailInner({
  score,
  userId,
  uploadAction,
  analysis,
  buildUrl,
  performanceCount,
  latestPitchAccuracy,
  currentStar = 1,
  infoSlot,
  practiceItemId,
  initialFavorite,
  backHref,
  backLabel,
  subTitle,
  cleared,
  fromScore,
  parts = [],
  teacherKartes = [],
  fingerNotes,
  songHeatmap = null,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ▼ 上達ループタブ (Phase 4-1、Score 演奏のみ。practice 経路では非表示)
  const isScoreMode = !practiceItemId
  const urlTab: ScoreDetailTabId =
    searchParams.get("tab") === "karte"
      ? "karte"
      : ["review", "loop"].includes(searchParams.get("tab") ?? "")
        ? "review"
        : "play"
  const [activeTab, setActiveTab] = useState<ScoreDetailTabId>(urlTab)
  // URL の ?tab= が外部から変わったら追従する (画面ガイドのタブ誘導 targetUrl など)。
  // タブ操作自体は setActiveTab で即時反映し、router.replace の完了を待たない。
  // 「props 変化に合わせた描画中の state 調整」= React 公式パターン (effect ではない)。
  const [lastUrlTab, setLastUrlTab] = useState<ScoreDetailTabId>(urlTab)
  if (urlTab !== lastUrlTab) {
    setLastUrlTab(urlTab)
    setActiveTab(urlTab)
  }
  const handleTabChange = useCallback(
    (next: ScoreDetailTabId) => {
      setActiveTab(next)
      const params = new URLSearchParams(searchParams.toString())
      if (next === "review" || next === "karte") {
        params.set("tab", next)
      } else {
        params.delete("tab")
      }
      const q = params.toString()
      router.replace(q ? `?${q}` : "?", { scroll: false })
    },
    [router, searchParams],
  )

  // 先生の添削(readOnly)を録音/練習の譜面に重ねる (2026-08-01)。存在するときだけトグルを出す。
  const [hasTeacherFeedback, setHasTeacherFeedback] = useState(false)
  const [showTeacherFeedback, setShowTeacherFeedback] = useState(false)
  // 先生あり生徒か (D: 演奏の「先生に共有」ボタンの出し分け)。teacherName で判定。
  const [studentHasTeacher, setStudentHasTeacher] = useState(false)
  // 採点カルテのコメント (2026-08-06統一): 添削データJSONに同居。添削が無くてもコメントだけで表示
  const [teacherComment, setTeacherComment] = useState<string | null>(null)
  const [teacherNameForKarte, setTeacherNameForKarte] = useState<string | null>(null)
  const teacherFeedbackRef = useRef<AnnotationData>({})
  useEffect(() => {
    let cancelled = false
    getFeedbackAsStudent(practiceItemId ? { practiceItemId } : { scoreId: score.id })
      .then((r) => {
        if (cancelled || !r.ok) return
        setStudentHasTeacher(r.teacherName != null)
        const d = r.data ?? {}
        const has =
          (d.highlight?.length ?? 0) > 0 ||
          (d.warnings?.length ?? 0) > 0 ||
          (d.notation?.length ?? 0) > 0
        teacherFeedbackRef.current = d
        setHasTeacherFeedback(has)
        const dc = (d as AnnotationData & { comment?: string | null }).comment
        setTeacherComment(typeof dc === "string" && dc.trim() ? dc : null)
        setTeacherNameForKarte(r.teacherName ?? null)
        // 添削があれば演奏モードの譜面に初期表示 (別画面に遷移しない)。トグルで隠せる。
        if (has) setShowTeacherFeedback(true)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [score.id, practiceItemId])
  const loadTeacherFeedback = useCallback(() => Promise.resolve(teacherFeedbackRef.current), [])

  // ▼ 非同期データ取得
  const [performances, setPerformances] = useState<PerformanceDTO[]>([])
  const [perfLoading, setPerfLoading] = useState(performanceCount > 0)
  const [selected, setSelected] = useState<PerformanceDTO | null>(null)
  // 録音直後のアルコ結果オーバーレイ (通し録音の解析完了で表示)
  const justRecordedRef = useRef<string | null>(null)
  const [arcoResult, setArcoResult] = useState<PerformanceDTO | null>(null)
  // 直近に録音した演奏ID (区間録音含む)。採点完了をポーリングで検知して Recorder の待ちカードへ後追い通知する
  const [lastRecordedId, setLastRecordedId] = useState<string | null>(null)

  // ▼ UI-6: 削除完了後の状態
  // - recentlyDeleted: 直前の操作が削除だった = ヒント表示用 (selected が再度選ばれたら解除)
  // - deleteToast: 「演奏を削除しました」トースト (3 秒で自動消去)
  const [recentlyDeleted, setRecentlyDeleted] = useState(false)
  const [deleteToast, setDeleteToast] = useState<string | null>(null)
  const deleteToastTimerRef = useRef<number | null>(null)
  useEffect(() => {
    // 別の演奏を選んだら hint は不要なので解除
    if (selected) setRecentlyDeleted(false)
  }, [selected])
  useEffect(() => {
    // unmount 時にトースト用タイマーを解放
    return () => {
      if (deleteToastTimerRef.current != null) {
        window.clearTimeout(deleteToastTimerRef.current)
      }
    }
  }, [])
  const handlePerformanceDeleted = useCallback((performanceId: string) => {
    setPerformances(prev => prev.filter(p => p.id !== performanceId))
    setSelected(prev => (prev?.id === performanceId ? null : prev))
    setRecentlyDeleted(true)
    setDeleteToast("演奏を削除しました")
    if (deleteToastTimerRef.current != null) {
      window.clearTimeout(deleteToastTimerRef.current)
    }
    deleteToastTimerRef.current = window.setTimeout(() => {
      setDeleteToast(null)
      deleteToastTimerRef.current = null
    }, 3000)
  }, [])
  const [playbackState, setPlaybackState] = useState<"stopped" | "playing" | "paused">("stopped")
  const [playbackTempo, setPlaybackTempo] = useState(analysis?.bpm ?? 90)
  // メトロノーム (お手本再生中に拍を刻む) 2026-07-18
  const [metronomeOn, setMetronomeOn] = useState(false)
  const metronomeOnRef = useRef(false)
  useEffect(() => { metronomeOnRef.current = metronomeOn }, [metronomeOn])
  // ▼ 区間ループ (部分練習 Phase 1) 2026-07-18: 譜面で開始/終了の音符を選び、その区間だけお手本をループ再生
  const [rangeMode, setRangeMode] = useState(false)          // 区間選択モード
  const [rangeStart, setRangeStart] = useState<number | null>(null) // note index
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)     // note index
  const [isRangeLooping, setIsRangeLooping] = useState(false)
  const rangeBandsRef = useRef<HTMLDivElement[]>([])         // オーバーレイのハイライト帯 + 両端ハンドル
  // 演奏バー(Step 2)の展開パネル: テンポ (区間は録音起点フローへ移設したので tempo のみ)
  const [openPanel, setOpenPanel] = useState<null | "tempo" | "range">(null)
  // 区間録音UX (2026-08-10): 録音ボタン起点の入口メニュー開閉。
  const [recordMenuOpen, setRecordMenuOpen] = useState(false)
  // 選択のポインタ操作 (なぞり/ハンドル/タップ) 用の作業 refs。
  // rangeStart/rangeEnd の最新値をリスナ内から読むためのミラー。
  const rangeStartRef = useRef<number | null>(null)
  const rangeEndRef = useRef<number | null>(null)
  const awaitingEndTapRef = useRef(false)                    // 開始タップ済み→終了タップ待ち
  const dragModeRef = useRef<null | "new" | "extend" | "start" | "end">(null)
  const dragAnchorRef = useRef<number>(0)                    // なぞり/タップの起点音符index
  const dragMovedRef = useRef(false)                         // 閾値超えの移動があったか(=なぞり)
  const dragDownXYRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  useEffect(() => { rangeStartRef.current = rangeStart }, [rangeStart])
  useEffect(() => { rangeEndRef.current = rangeEnd }, [rangeEnd])
  // 区間録音 (部分練習 Phase 2b): この録音が区間演奏か。pending=録音開始トリガ直前にステージ、
  // recording=進行中の録音に確定した区間 (アップロード時に読む)。null = 通常の全体録音。
  const pendingRangeRef = useRef<{ from: number; to: number } | null>(null)
  const recordingRangeRef = useRef<{ from: number; to: number } | null>(null)
  // パート分け (2026-07-26): 区間がどの名前付きパートか。pending→recording は区間と同じタイミングで確定。
  const pendingPartIdRef = useRef<string | null>(null)
  const recordingPartIdRef = useRef<string | null>(null)
  // 現在選択中のパート (UI表示用)。null = 通し。
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null)
  const recGuideOffsetSecRef = useRef<number>(0) // 録音ガイドの開始オフセット秒 (区間先頭ノートの開始秒)
  // 区間録音の自動停止 (2c): この実経過秒に達したら録音を止める。全体録音は Infinity (末尾停止は別effect)。
  const recGuideStopAtRealSecRef = useRef<number>(Infinity)
  const [, setComparisonLoading] = useState(false)

  // ▼ ポップオーバー
  type NotePopover = { note: ComparisonNote; left: number; top: number }
  const [popover, setPopover] = useState<NotePopover | null>(null)
  const scoreWrapperRef = useRef<HTMLDivElement>(null)

  // ▼ 録音テンポ（Recorder から通知される）
  // ref は startRecordingGuide の rAF tick から同期参照、state は F-1 の useEffect/scrollPlan 再計算に使う
  const recordingBpmRef = useRef(analysis?.bpm ?? 90)
  const [recordingBpm, setRecordingBpm] = useState<number | null>(null)
  const handleRecordingBpmChange = useCallback((v: number) => {
    recordingBpmRef.current = v
    setRecordingBpm(v)
  }, [])

  // ▼ 録音状態 (F-1 のフルスクリーン化トリガ用)。Recorder 内の status を最小限ミラー
  const [recordingState, setRecordingState] = useState<RecorderStatus>("idle")
  // idle を離れたら入口メニューは閉じる (録音/カウントイン中に残らないように)
  useEffect(() => { if (recordingState !== "idle") setRecordMenuOpen(false) }, [recordingState])

  // ▼ F-1: 録音中 (countdown / recording) は body に data-fullscreen を付与
  // 親ページ (practice の breadcrumb 等) も含めて全画面化したいので body 経由
  const isFullscreen = recordingState === "countdown" || recordingState === "recording"
  useEffect(() => {
    if (isFullscreen) {
      document.body.setAttribute("data-fullscreen", "true")
    } else {
      document.body.removeAttribute("data-fullscreen")
    }
    return () => {
      document.body.removeAttribute("data-fullscreen")
    }
  }, [isFullscreen])

  // ▼ 9a帯モード (横画面録音): 開発スイッチ ?recband=1 で有効化。
  // アプリの向きロック結線 (isNativeApp) は殻v2反映後に追加する。
  // 録音全画面中のみ帯レイアウト+横スクロール。Web版はスイッチ無しでは一切不変。
  const [recBandRequested] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("recband"),
  )
  // アプリ実機: 録音開始 (カウントイン) で横固定を試み、成功したときだけ帯モード。
  // 失敗・プラグイン不在・Web版は縦のまま (フォールバック)。解除は effect クリーンアップ
  // (recordingState離脱・アンマウント) + pagehide の全経路で冪等に行う。
  const [nativeBandOk, setNativeBandOk] = useState(false)
  // 2026-08-26: 帯モードの組み直しを「カウントダウンより前」に終わらせるための橋渡し。
  // 以前は onCountdownStart で isFullscreen→lockLandscape→帯モード→OSMD作り直し という
  // 順序だったため、4拍のカウントの最中に楽譜の再取得と再描画が2〜4回走り、
  // テンポガイドの青線が固まって飛ぶ・クリック音の間隔が乱れる原因になっていた。
  const [bandPrep, setBandPrep] = useState(false)
  const bandReadyResolveRef = useRef<(() => void) | null>(null)
  const onBandReady = useCallback(() => {
    bandReadyResolveRef.current?.()
    bandReadyResolveRef.current = null
  }, [])

  /** 端末の回転が落ち着くまで待つ。イベントが来なければ早めに諦める (Web版・既に横 など) */
  const waitForRotation = useCallback(() => {
    return new Promise<void>((resolve) => {
      let settle: ReturnType<typeof setTimeout> | null = null
      let last = `${window.innerWidth}x${window.innerHeight}`
      const done = () => {
        if (settle) clearTimeout(settle)
        clearTimeout(firstGuard)
        clearTimeout(hardStop)
        window.removeEventListener("resize", onChange)
        window.removeEventListener("orientationchange", onChange)
        resolve()
      }
      const onChange = () => {
        clearTimeout(firstGuard)
        const now = `${window.innerWidth}x${window.innerHeight}`
        if (now !== last) last = now
        if (settle) clearTimeout(settle)
        settle = setTimeout(done, 250) // 250ms 変化が無ければ落ち着いたとみなす
      }
      // 既に横向きなど回転イベントが来ない場合に備えた見切り (700ms)
      const firstGuard = setTimeout(done, 700)
      // 何があっても 1.5 秒で打ち切る (録音を始められない事態を作らない)
      const hardStop = setTimeout(done, 1500)
      window.addEventListener("resize", onChange)
      window.addEventListener("orientationchange", onChange)
    })
  }, [])

  /** 帯モードの描画完了を待つ。合図が来なければ 4 秒で打ち切る */
  const waitForBandRender = useCallback(() => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => { bandReadyResolveRef.current = null; resolve() }, 4000)
      bandReadyResolveRef.current = () => { clearTimeout(timer); resolve() }
    })
  }, [])

  /**
   * 録音ボタンを押したあと、カウントダウンを始める前に呼ばれる。
   * 横固定 → 回転が落ち着くのを待つ → 帯モードで組み直す → 完了を待つ。
   * 横固定できない環境 (Web版・プラグイン不在) は即座に抜けるので待ち時間は増えない。
   */
  const prepareBand = useCallback(async () => {
    const dev = recBandRequested
    const ok = dev ? true : await lockLandscape()
    setNativeBandOk(ok)
    if (!ok) { setBandPrep(false); return }
    // 順序が重要: 先に回転を終わらせる。
    // 組み直しは「そのときの画面幅」で1小節の幅を測って倍率を決めるため、
    // 縦のまま組み直すと測り直しが必要になり、再描画がもう一度走ってしまう。
    if (!dev) await waitForRotation()
    setBandPrep(true)                 // ここで recBand=true → 帯モードの組み直しが始まる
    await waitForBandRender()
  }, [recBandRequested, waitForRotation, waitForBandRender])

  // カウントダウンに入ったら橋渡しの役目は終わり (以後は isFullscreen が帯モードを支える)
  useEffect(() => { if (isFullscreen) setBandPrep(false) }, [isFullscreen])

  // 録音でなくなったら向きロックを解除する。
  // 「録音中だった → そうでなくなった」の遷移でだけ解除する。無条件に呼ぶと
  // OrientationLock が掛けた縦固定まで外してしまうため。
  const bandActive = isFullscreen || bandPrep
  const bandActiveRef = useRef(false)
  useEffect(() => {
    if (bandActive) { bandActiveRef.current = true; return }
    if (!bandActiveRef.current) return
    bandActiveRef.current = false
    setNativeBandOk(false)
    void unlockOrientation()
  }, [bandActive])
  // アンマウント時の取りこぼし防止 (冪等)
  useEffect(() => () => {
    if (bandActiveRef.current) { bandActiveRef.current = false; void unlockOrientation() }
  }, [])
  useEffect(() => {
    const onPageHide = () => { void unlockOrientation() }
    window.addEventListener("pagehide", onPageHide)
    return () => window.removeEventListener("pagehide", onPageHide)
  }, [])

  const recBand = (isFullscreen || bandPrep) && (recBandRequested || nativeBandOk)
  useEffect(() => {
    if (recBand) {
      document.body.setAttribute("data-rec-band", "true")
    } else {
      document.body.removeAttribute("data-rec-band")
    }
    return () => {
      document.body.removeAttribute("data-rec-band")
    }
  }, [recBand])

  // B8: 横バーの経過時間 (録音ガイドと同じ開始基準)。帯モード中のみ計時
  const [bandElapsedSec, setBandElapsedSec] = useState(0)
  useEffect(() => {
    if (!recBand || recordingState !== "recording") { setBandElapsedSec(0); return }
    const t = setInterval(() => {
      if (recGuideStartRef.current) {
        setBandElapsedSec(Math.max(0, Math.floor((performance.now() - recGuideStartRef.current) / 1000)))
      }
    }, 500)
    return () => clearInterval(t)
  }, [recBand, recordingState])

  // ▼ 拡大ビュー (2026-08-15): 縦のまま譜面だけの全画面。録音全画面が始まったら自動で閉じる
  const [scoreExpand, setScoreExpand] = useState(false)
  useEffect(() => {
    if (isFullscreen && scoreExpand) setScoreExpand(false)
  }, [isFullscreen, scoreExpand])
  useEffect(() => {
    if (scoreExpand) {
      document.body.setAttribute("data-score-expand", "true")
    } else {
      document.body.removeAttribute("data-score-expand")
    }
    return () => {
      document.body.removeAttribute("data-score-expand")
    }
  }, [scoreExpand])

  // ▼ アップロード進捗 (0-100、未開始時は null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // 解析中の performance を 3 秒ごとに再 fetch
  useEffect(() => {
    const hasPending = performances.some(
      p => p.analysisStatus && p.analysisStatus !== "done" && p.analysisStatus !== "error"
    )
    if (!hasPending) return
    const apiBase = practiceItemId
      ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
      : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
    const timer = setInterval(() => {
      fetch(apiBase)
        .then(res => res.json())
        .then((data: PerformanceDTO[]) =>
          // 既にロード済みの comparison を保持しつつ他フィールドを更新 (ポーリング上書き防止)
          setPerformances(prev => data.map(d => {
            const old = prev.find(p => p.id === d.id)
            return old?.comparisonResult
              ? { ...d, comparisonResult: old.comparisonResult, comparisonWarnings: old.comparisonWarnings }
              : d
          }))
        )
        .catch(() => {})
    }, 3000)
    return () => clearInterval(timer)
  }, [performances, score.id, userId, practiceItemId])

  // パフォーマンスデータの非同期取得
  useEffect(() => {
    if (performanceCount === 0) { setPerfLoading(false); return }
    const apiBase = practiceItemId
      ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
      : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
    fetch(apiBase)
      .then(res => res.json())
      .then((data: PerformanceDTO[]) => {
        setPerformances(data)
        if (data.length > 0) {
          const first = data[0]
          // 演奏モード既定のため自動選択はしない。comparison だけ先読みしておく
          void 0
          if (!first.comparisonResult && first.pitchAccuracy != null) {
            const compApi = practiceItemId
              ? `/api/practice-performances/${first.id}/comparison`
              : `/api/score-performances/${first.id}/comparison`
            fetch(compApi).then(r => r.json()).then(compData => {
              let comparisonResult = null
              let comparisonWarnings: string[] = []
              if (compData.results) {
                comparisonResult = compData.results
                comparisonWarnings = compData.warnings || []
              } else if (Array.isArray(compData)) {
                comparisonResult = compData
              }
              setPerformances(prev => prev.map(p => p.id === first.id ? { ...p, comparisonResult, comparisonWarnings } : p))
              setSelected(prev => prev?.id === first.id ? { ...prev, comparisonResult, comparisonWarnings } : prev)
            }).catch(() => {})
          }
        }
        setPerfLoading(false)
      })
      .catch(() => setPerfLoading(false))
  }, [score.id, userId, performanceCount, practiceItemId])

  // comparison 詳細の遅延取得
  const loadComparison = useCallback(async (perf: PerformanceDTO) => {
    if (perf.comparisonResult) return
    setComparisonLoading(true)
    try {
      const apiBase = practiceItemId
        ? `/api/practice-performances/${perf.id}/comparison`
        : `/api/score-performances/${perf.id}/comparison`
      const res = await fetch(apiBase)
      const data = await res.json()
      let comparisonResult = null
      let comparisonWarnings: string[] = []
      if (data.results) {
        comparisonResult = data.results
        comparisonWarnings = data.warnings || []
      } else if (Array.isArray(data)) {
        comparisonResult = data
      }
      setPerformances(prev => prev.map(p => p.id === perf.id ? { ...p, comparisonResult, comparisonWarnings } : p))
      setSelected(prev => prev?.id === perf.id ? { ...prev, comparisonResult, comparisonWarnings } : prev)
    } catch { /* ignore */ }
    setComparisonLoading(false)
  }, [practiceItemId])

  const handleSelectPerformance = useCallback((p: PerformanceDTO) => {
    setPopover(null)
    // アコーディオン: 開いているカードを再タップしたら閉じる
    const willClose = selected?.id === p.id
    setSelected(willClose ? null : p)
    // 開くときだけ comparison をロード (loadComparison は既ロード時 early-return)
    if (!willClose && !p.comparisonResult && p.pitchAccuracy != null) {
      loadComparison(p)
    }
  }, [selected, loadComparison])

  // 演奏セレクタ (譜面の上で過去の演奏を選び、フィードバックを譜面に色表示) 2026-07-18
  // 直接選択版 (トグルしない)。selected を設定すると comparison(useMemo) 経由で譜面が色付く。
  const selectPerformanceById = useCallback((id: string | null) => {
    setPopover(null)
    if (!id) { setSelected(null); return }
    const p = performances.find((x) => x.id === id)
    if (!p) return
    setSelected(p)
    if (!p.comparisonResult && p.pitchAccuracy != null) {
      loadComparison(p)
    }
  }, [performances, loadComparison])

  // リネーム (演奏履歴カード・セレクタ横 共通)
  const handleRenamed = useCallback((performanceId: string, newName: string) => {
    setPerformances((prev) => prev.map((p) => (p.id === performanceId ? { ...p, name: newName } : p)))
    setSelected((prev) => (prev && prev.id === performanceId ? { ...prev, name: newName } : prev))
  }, [])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [renameSaving, setRenameSaving] = useState(false)
  const submitRename = useCallback(async () => {
    if (!renamingId || renameSaving) return
    setRenameSaving(true)
    const res = await renamePerformance({
      performanceId: renamingId,
      kind: practiceItemId ? "practice" : "score",
      name: renameDraft,
    })
    setRenameSaving(false)
    if (res.ok) {
      handleRenamed(renamingId, res.name)
      setRenamingId(null)
    }
  }, [renamingId, renameSaving, renameDraft, practiceItemId, handleRenamed])

  // 過去ベストスコア（ピッチ）— 録音後フィードバックの比較用
  // 区間演奏(rangeFromNote != null)は練習補助であり、ベスト/レベル等の公式表示には非算入。
  const fullPerformances = useMemo(
    () => performances.filter(p => p.rangeFromNote == null),
    [performances],
  )

  const bestPitchScore = useMemo(() => {
    if (fullPerformances.length === 0) return latestPitchAccuracy ?? undefined
    const scores = fullPerformances.map(p => p.pitchAccuracy ?? null).filter((s): s is number => s !== null)
    return scores.length > 0 ? Math.max(...scores) : latestPitchAccuracy ?? undefined
  }, [fullPerformances, latestPitchAccuracy])

  // 現在のレベル（直近 RECENT_LEVEL_N 回の「音程・リズム平均」の平均）— 録音ボタン上の表示用。
  // overallScore は bowing(skill)依存で欠損しやすいため、確実に入る
  // pitchAccuracy / timingAccuracy の 2 軸平均でレベルを可視化する。
  const recentLevel = useMemo(() => {
    const RECENT_LEVEL_N = 5
    const scored = fullPerformances
      .filter(p => p.pitchAccuracy != null && p.timingAccuracy != null)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, RECENT_LEVEL_N)
      .map(p => (p.pitchAccuracy! + p.timingAccuracy!) / 2)
    if (scored.length === 0) return null
    const avg = Math.round(scored.reduce((sum, v) => sum + v, 0) / scored.length)
    return { avg }
  }, [fullPerformances])

  // Recorder の onRecordingComplete ハンドラ (G-1 + Path B、v3.3 spec Commit 3)
  // 旧: convert-audio → uploadRecord(WAV FormData)
  // 新: getSignedUploadUrl → XHR PUT 直接 → uploadAction({ performanceId, recordingBpm })
  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    const mimeType = blob.type || "audio/webm"  // iOS Safari は audio/mp4

    // 1. signed URL 取得 (Performance 行作成 + audioPath 確定済み = Commit 2 Step A-D)
    const signedRes = practiceItemId
      ? await getSignedUploadUrl({ kind: "practice", itemId:  practiceItemId, mimeType })
      : await getSignedUploadUrl({ kind: "score",    scoreId: score.id,        mimeType })
    if (!signedRes.ok) return { error: signedRes.error }

    // 2. Supabase Storage に直接 PUT (XMLHttpRequest で進捗取得)
    setUploadProgress(0)
    const uploadStatus = await new Promise<{ ok: boolean; httpStatus: number }>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload  = () => resolve({ ok: xhr.status >= 200 && xhr.status < 300, httpStatus: xhr.status })
      xhr.onerror = () => resolve({ ok: false, httpStatus: 0 })  // ネットワークエラー
      xhr.open("PUT", signedRes.signedUrl)
      xhr.setRequestHeader("Content-Type", mimeType)
      xhr.send(blob)
    })
    setUploadProgress(null)

    // エラー分類 1: ネットワークエラー
    if (uploadStatus.httpStatus === 0) {
      return { error: "ネットワーク接続を確認して再試行してください" }
    }
    // エラー分類 2: アップロード失敗 (HTTP 4xx/5xx)
    if (!uploadStatus.ok) {
      return { error: "アップロードに失敗しました。もう一度お試しください" }
    }

    // 3. 解析起動を通知 (区間録音ならこの録音に確定した区間を渡す → Python が部分採点)
    const activeRange = recordingRangeRef.current
    recordingRangeRef.current = null
    const activePartId = recordingPartIdRef.current
    recordingPartIdRef.current = null
    recGuideOffsetSecRef.current = 0
    recGuideStopAtRealSecRef.current = Infinity
    const notifyResult = await uploadAction({
      performanceId: signedRes.performanceId,
      recordingBpm: recordingBpmRef.current,
      guideOffsetSec: guideOffsetSecRef.current,
      rangeFromNote: activeRange?.from,
      rangeToNote: activeRange?.to,
      partId: activePartId ?? undefined,
    })
    // エラー分類 3: 解析起動失敗 (録音は Storage に保存済み)
    if (notifyResult?.error) {
      return { error: `録音は保存されましたが、解析に失敗しました (${notifyResult.error})` }
    }

    // 通し録音(非区間)かつ曲モードなら、解析完了後にアルコ結果オーバーレイを出す。
    // モバイルでの背面化/再読込/ブラウザバック復帰でも拾えるよう sessionStorage にも保持。
    const arcoPendingId = (activeRange || practiceItemId) ? null : signedRes.performanceId
    justRecordedRef.current = arcoPendingId
    setLastRecordedId(signedRes.performanceId) // 待ちカードの完了後追い用 (区間録音・練習教材も対象)
    if (arcoPendingId) {
      try { sessionStorage.setItem("arcoPending", JSON.stringify({ scoreId: score.id, perfId: arcoPendingId, at: Date.now() })) } catch {}
    }

    // 4. 後続処理 (latest perf 取得・comparison ロード・state 更新) - 既存ロジック踏襲
    try {
      const apiUrl = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}&limit=2`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}&limit=2`
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error("fetch failed")
      const perfs = await res.json()
      const latest = perfs[0], previous = perfs[1]
      const pitchAccuracy = latest?.pitchAccuracy ?? null
      const timingAccuracy = latest?.timingAccuracy ?? null
      // overallScore 廃止: 録音後フィードバックも演奏スコア(音程+リズム平均)で表示
      const overallScore = latest ? performanceScore(latest) : null
      const prevOverall = previous ? performanceScore(previous) : null
      const isPersonalBest = overallScore != null && (prevOverall == null || overallScore > prevOverall)
      router.refresh()
      const allApiUrl = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
      fetch(allApiUrl).then(r => r.json()).then((data: PerformanceDTO[]) => {
        setPerformances(data)
        if (data.length > 0) {
          const first = data[0]
          // 録音後も演奏モードを維持 (結果はアルコ結果オーバーレイ + Recorder 結果で表示)。comparison だけ先読み
          if (!first.comparisonResult && first.pitchAccuracy != null) {
            loadComparison(first)
          }
        }
      }).catch(() => {})
      return {
        success: true,
        result: {
          pitchAccuracy: pitchAccuracy ?? undefined,
          timingAccuracy: timingAccuracy ?? undefined,
          overallScore: overallScore ?? undefined,
          isPersonalBest,
          previousScore: (previous?.pitchAccuracy ?? bestPitchScore) ?? undefined,
          previousOverall: prevOverall ?? undefined,
          analysisSummary: latest?.analysisSummary,
        },
      }
    } catch {
      router.refresh()
      return { success: true }
    }
  }, [score.id, userId, uploadAction, bestPitchScore, router, practiceItemId, loadComparison])

  // 解析完了した「今録音した曲演奏」を検知してアルコ結果を表示 (3秒ポーリング/復帰再取得が performances を更新)
  useEffect(() => {
    const id = justRecordedRef.current
    if (!id) return
    const p = performances.find((x) => x.id === id)
    if (p && p.analysisStatus === "done" && p.pitchAccuracy != null && p.timingAccuracy != null) {
      justRecordedRef.current = null
      try { sessionStorage.removeItem("arcoPending") } catch {}
      // 2026-08-12 Tetsuo指摘の二段表示バグ修正: Recorder自身の結果パネル(カルテ導線なし)が先に見え、
      // あとからアルコ結果が出る2段階になっていた → 解析完了と同時にアルコ結果を自動で開く。
      // (同一レンダリングで開くため、背後のRecorderパネルは見えない)
      setArcoResult(p)
    }
  }, [performances])

  // 再読込/ブラウザバック後も拾えるよう、保存済みの pending 録音を復元 (マウント時)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("arcoPending")
      if (!raw) return
      const p = JSON.parse(raw) as { scoreId?: string; perfId?: string; at?: number }
      if (p?.scoreId === score.id && p.perfId && (!p.at || Date.now() - p.at < 3600_000)) {
        justRecordedRef.current = p.perfId
      } else {
        sessionStorage.removeItem("arcoPending")
      }
    } catch {}
  }, [score.id])

  // フォアグラウンド復帰時に performances を再取得 (モバイルは背面でタイマーが止まるため、
  // 復帰した瞬間に解析完了を拾えるようにする)
  useEffect(() => {
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      if (!justRecordedRef.current) return
      const apiBase = practiceItemId
        ? `/api/practice-performances?practiceItemId=${practiceItemId}&userId=${userId}`
        : `/api/score-performances?scoreId=${score.id}&userId=${userId}`
      fetch(apiBase).then((r) => r.json()).then((data: PerformanceDTO[]) => {
        setPerformances((prev) => data.map((d) => {
          const old = prev.find((p) => p.id === d.id)
          return old?.comparisonResult ? { ...d, comparisonResult: old.comparisonResult, comparisonWarnings: old.comparisonWarnings } : d
        }))
      }).catch(() => {})
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [score.id, userId, practiceItemId])

  // =========================================================
  // 再生・ハイライト関連
  // =========================================================

  // 2026-08-27: 合成 (Tone.Synth + Vibrato) → 実録音のサンプラーへ。
  // 波形1つでは倍音も弓の立ち上がりも胴の響きも無く、機械音の域を出なかった。
  // 音源とインスタンスは app/_libs/violinSampler.ts が持つ (奏法ごとに使い分ける)。
  const partRef = useRef<Tone.Part | null>(null)
  const colorTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]) // 比較色付けの遅延タイマー群
  // 視覚ビート(青い線の上で上下に揺れる丸)。表拍=下/裏拍=上
  const beatBallRef = useRef<HTMLDivElement | null>(null)
  const noteElementsRef = useRef<Element[]>([])
  const animationRef = useRef<number | null>(null)
  const activeTempoRatioRef = useRef<number>(1)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const pausedAtRef = useRef<number>(0)

  // UI-4: 気になる箇所ハイライト管理
  // - 紫 (#8b5cf6) drop-shadow を 3 秒間付与し、別カードタップ or タイマー経過で消す
  // - 既存の colorizeNote とは衝突しない (filter プロパティを使うため)
  const problematicHighlightTimerRef = useRef<number | null>(null)
  const problematicHighlightedElsRef = useRef<Element[]>([])

  // ▼ OSMDカーソルAPIベースのタイムスタンプマップ
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const [isOsmdReady, setIsOsmdReady] = useState(false)
  const timeToGNotesMap = useRef<Map<number, any[]>>(new Map())
  const sortedTimes = useRef<number[]>([])
  // 層1 (不変): 時刻 → 不変 Note 模型オブジェクト。
  //   録音テンポガイド専用。SVG/GraphicalNote は保持しない (stale 元凶を断つ)。
  //   毎フレーム osmd.rules.GNote(sourceNote) で現在の SVG をライブ解決する (層2)。
  //   timeToGNotesMap (再生ハイライト用) とは責務分離し、そちらは非改修。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeToSourceNote = useRef<Map<number, any>>(new Map())
  const lastHighlightedTimeRef = useRef<number>(-1)

  const HIGHLIGHT_THRESHOLD_SEC = 0.15

  // OSMDカーソルで 時刻(秒) → GraphicalNote[] マップを構築
  const buildTimeToGNotesMap = useCallback((bpm: number) => {
    const osmd = osmdRef.current
    if (!osmd?.cursor) return

    timeToGNotesMap.current.clear()
    timeToSourceNote.current.clear()
    sortedTimes.current = []

    try {
      osmd.cursor.show()
      osmd.cursor.reset()
      const iterator = osmd.cursor.iterator

      while (!iterator.EndReached) {
        const ts = iterator.currentTimeStamp as any
        const timeSec = (ts.realValue ?? ts.RealValue ?? (ts.Numerator / ts.Denominator)) * 4 * 60 / bpm
        const rounded = Math.round(timeSec * 100) / 100
        const gNotes = osmd.cursor.GNotesUnderCursor()
        if (gNotes && gNotes.length > 0) {
          timeToGNotesMap.current.set(rounded, [...gNotes])
          // 層1: 不変 Note 模型のみ保持 (sourceNote は再描画で不変)。
          //   SVG は録音時に osmd.rules.GNote(sourceNote) でライブ解決する。
          timeToSourceNote.current.set(rounded, gNotes[0].sourceNote)
          sortedTimes.current.push(rounded)
        }
        iterator.moveToNext()
      }

      sortedTimes.current.sort((a, b) => a - b)
      osmd.cursor.hide()
    } catch (e) {
      console.warn("buildTimeToGNotesMap failed:", e)
    }
  }, [])

  // バイナリサーチで最近傍のタイムスタンプを見つける
  const findNearestGNotes = useCallback((currentSec: number): any[] | null => {
    const times = sortedTimes.current
    if (times.length === 0) return null

    let lo = 0, hi = times.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (times[mid] < currentSec) lo = mid + 1
      else hi = mid
    }

    const candidates = [times[lo]]
    if (lo > 0) candidates.push(times[lo - 1])
    const nearest = candidates.reduce((a, b) =>
      Math.abs(a - currentSec) <= Math.abs(b - currentSec) ? a : b
    )

    return Math.abs(nearest - currentSec) <= HIGHLIGHT_THRESHOLD_SEC
      ? (timeToGNotesMap.current.get(nearest) ?? null)
      : null
  }, [])

  // ハイライト中のGNotesを保持（復元用）
  const highlightedGNotesRef = useRef<any[]>([])

  // ハイライトをクリア（OSMD setColor APIで元に戻す）
  const clearHighlight = useCallback(() => {
    highlightedGNotesRef.current.forEach((gNote: any) => {
      gNote.setColor?.("#000000")
    })
    highlightedGNotesRef.current = []
    lastHighlightedTimeRef.current = -1
  }, [])

  // 時刻ベースでハイライト（OSMD setColor API）
  const highlightNoteAtTime = useCallback((currentSec: number) => {
    const rounded = Math.round(currentSec * 100) / 100
    if (rounded === lastHighlightedTimeRef.current) return

    // 前のハイライトを解除
    clearHighlight()

    const gNotes = findNearestGNotes(currentSec)
    if (!gNotes) return

    gNotes.forEach((gNote: any) => {
      gNote.setColor?.(HIGHLIGHT_COLOR)
      highlightedGNotesRef.current.push(gNote)
    })

    lastHighlightedTimeRef.current = rounded
  }, [findNearestGNotes, clearHighlight])

  // --- v1→v2正規化 ---
  const comparison = useMemo(
    () => normalizeComparison(selected?.comparisonResult ?? null),
    [selected]
  )

  // 区間プリセット「難所」: 直近採点(選択中の演奏)の comparison から、
  // pitch/timing いずれかが NG の音符が連続する最長区間を [from,to] (音符index) で返す。
  // NG が無い/採点データが無い場合は null → 「難所」プリセットは表示しない。
  const hardestRange = useMemo<{ from: number; to: number } | null>(() => {
    if (!comparison || comparison.length === 0) return null
    const sorted = [...comparison].sort((a, b) => a.note_index - b.note_index)
    const isNG = (c: ComparisonNote) => c.pitch_ok === false || c.start_ok === false
    let best: { from: number; to: number } | null = null
    let runStart: number | null = null
    let runEnd: number | null = null
    for (const c of sorted) {
      if (isNG(c)) {
        if (runStart === null) runStart = c.note_index
        runEnd = c.note_index
        const len = runEnd - runStart + 1
        if (!best || len > best.to - best.from + 1) best = { from: runStart, to: runEnd }
      } else {
        runStart = null
        runEnd = null
      }
    }
    return best
  }, [comparison])

  // 小節スナップ用マップ (2026-08-10):
  // noteElements の index は analysis.notes の index と 1:1 (analysisIdxToOsmdIdx と同前提。
  // VexFlow は休符も vf-stavenote として描画するため index が一致する)。よって
  // analysis.notes[i].measure_number をそのまま note index → 小節番号 の対応に使える。
  // 全音符に measure_number があるときのみ ok=true とし、なぞり選択の端を小節境界へ寄せる。
  const measureMap = useMemo(() => {
    if (!analysis) return null
    const noteToMeasure: (number | null)[] = []
    const first = new Map<number, number>()
    const last = new Map<number, number>()
    let ok = true
    analysis.notes.forEach((n, i) => {
      const m = n.measure_number
      if (typeof m === "number") {
        noteToMeasure[i] = m
        if (!first.has(m)) first.set(m, i)
        last.set(m, i)
      } else {
        noteToMeasure[i] = null
        if (n.type === "note") ok = false
      }
    })
    return { noteToMeasure, first, last, ok }
  }, [analysis])

  // なぞり端 → 小節先頭/末尾の音符index へスナップ (小節データが無ければ素通し)
  const snapStart = useCallback((idx: number): number => {
    if (!measureMap?.ok) return idx
    const m = measureMap.noteToMeasure[idx]
    return m != null ? (measureMap.first.get(m) ?? idx) : idx
  }, [measureMap])
  const snapEnd = useCallback((idx: number): number => {
    if (!measureMap?.ok) return idx
    const m = measureMap.noteToMeasure[idx]
    return m != null ? (measureMap.last.get(m) ?? idx) : idx
  }, [measureMap])

  // クリック/ポインタ座標 → 最近傍の音符index (距離も返す)。ヒットテストの唯一の実装。
  const nearestNoteIdx = useCallback((clientX: number, clientY: number): { idx: number; dist: number } => {
    const els = noteElementsRef.current
    let bi = 0, bd = Infinity
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const d = (clientX - cx) ** 2 + (clientY - cy) ** 2
      if (d < bd) { bd = d; bi = i }
    }
    return { idx: bi, dist: Math.sqrt(bd) }
  }, [])

  // リサイズ後の再レンダリング検知用（インクリメントで applyComparisonColors を再トリガー）
  const [noteElementsVersion, setNoteElementsVersion] = useState(0)

  // --- オンボーディング: 解析オーバーレイ描画完了を Provider に通知 ---
  // applyComparisonColors の setTimeout 連鎖 (最大 800ms) を待ってから dispatch
  const { markAnalysisOverlayRendered, activeGuideMarkId, setOnboardingSamplePiece, setOnboardingEnding, allGuidesDismissed, welcomeSlidesShown, pageGuidesSeen } = useOnboarding()
  // オンボの「録音」ステップ表示中だけ、録音ボタンを「ふりかえりへ進むだけのボタン」に差し替える。
  // 実録音は省くという方針 (通常ユーザーの録音ボタンは元のまま)。
  const onboardingRecordStep = isScoreMode && activeGuideMarkId === "scoreDetail.record"
  // オンボ進行中 (はじめてガイド済み・未dismiss・締めの homeEnding 未到達) の判定。
  // 「ホームに戻る」バナーの表示に使う (samplePiece 有無に依存させない = 確実に出す)。
  const onboardingActive = welcomeSlidesShown && !allGuidesDismissed && !pageGuidesSeen.has("homeEnding")
  useEffect(() => {
    if (!selected?.comparisonResult) return
    if (noteElementsRef.current.length === 0) return
    const id = setTimeout(() => {
      requestAnimationFrame(() => {
        markAnalysisOverlayRendered()
      })
    }, 900)
    return () => clearTimeout(id)
  }, [selected?.comparisonResult, noteElementsVersion, markAnalysisOverlayRendered])

  // --- オンボ: 開いた曲を「終盤の見本ホーム」用に控える ---
  // ツアーでは実録音を省くので、録音タップ時ではなく「曲を開いた時点」で確実に保存する。
  // これで練習教材まで進んでも samplePiece が残り、ホームで「弾いたらこう出る」見本を出せる。
  useEffect(() => {
    if (isScoreMode && !allGuidesDismissed) {
      setOnboardingSamplePiece({ id: score.id, title: score.title, cover: null, star: null })
    }
  }, [isScoreMode, allGuidesDismissed, score.id, score.title, setOnboardingSamplePiece])

  // オンボ中に練習教材まで来たら「締め」を armed 状態にする。以後どの経路 (サイドバーの
  // 「ホーム」含む) でホームに戻っても、見本ホーム + 締めガイドが出る。
  useEffect(() => {
    if (practiceItemId && onboardingActive) setOnboardingEnding(true)
  }, [practiceItemId, onboardingActive, setOnboardingEnding])

  // --- 記号ガイド: 譜面に出てくる記号・技法 (2026-07-25) ---
  // analysis.json に既にある情報から抽出するだけなので追加の通信は無い。
  // ランク出し分け (2026-08-10): ★4+ (中級者以上) には基礎の読譜記号(調号/拍子/臨時記号/反復/とび先/8va)を出さない。
  const scoreSymbols = useMemo(() => {
    const raw = extractScoreSymbols(analysis)
    if (currentStar < BASIC_SYMBOL_HIDE_STAR) return raw
    const list = raw.list.filter((s) => !BASIC_READING_SYMBOL_IDS.has(s.id))
    const byNote = new Map<number, string[]>()
    for (const [ni, ids] of raw.byNote) {
      const kept = ids.filter((id) => !BASIC_READING_SYMBOL_IDS.has(id))
      if (kept.length) byNote.set(ni, kept)
    }
    return { list, byNote }
  }, [analysis, currentStar])
  const [symbolTapMode, setSymbolTapMode] = useState(false)
  const symbolGuideRef = useRef<SymbolGuideHandle | null>(null)
  const symbolTapModeRef = useRef(false)
  symbolTapModeRef.current = symbolTapMode

  // --- ScoreViewer からノート要素を受け取る（評価オーバーレイ用）---
  const handleNoteElementsReady = useCallback((elements: Element[]) => {
    noteElementsRef.current = elements
    setNoteElementsVersion(v => v + 1)
    setPopover(null)
  }, [])

  // --- OSMDインスタンスを受け取り、タイムスタンプマップを構築 ---
  const handleOsmdReady = useCallback((osmd: OpenSheetMusicDisplay) => {
    osmdRef.current = osmd
    setIsOsmdReady(true)
    if (analysis) {
      requestAnimationFrame(() => {
        buildTimeToGNotesMap(analysis.bpm)
      })
    }
  }, [analysis, buildTimeToGNotesMap])

  useEffect(() => {
    return () => {
      setIsOsmdReady(false)
    }
  }, [score.id])

  // 注: 旧「MutationObserver で再描画検知 → timeToGNotesMap 再構築」effect は撤去。
  //   P-1 層分離設計により録音テンポガイドは層1 (不変 Note 模型) + 層2
  //   (毎フレーム osmd.rules.GNote ライブ解決) で再描画に追従するため、
  //   キャッシュ再構築機構そのものが不要。層1 は handleOsmdReady で構築され、
  //   再描画時も既存 ScoreViewer 経由で handleOsmdReady が再呼出される (冪等)。

  // analysis.notes インデックス → OSMD要素インデックス の変換（評価オーバーレイ用）
  // VexFlow は休符も vf-stavenote として描画するため note_index を直接 OSMD インデックスとして使う
  const analysisIdxToOsmdIdx = useCallback((analysisIdx: number): number => {
    if (!analysis || analysisIdx < 0) return -1
    if (analysisIdx < analysis.notes.length && analysis.notes[analysisIdx].type !== "note") {
      return -1
    }
    return analysisIdx < noteElementsRef.current.length ? analysisIdx : -1
  }, [analysis])

  const clearProblematicHighlight = useCallback(() => {
    if (problematicHighlightTimerRef.current != null) {
      window.clearTimeout(problematicHighlightTimerRef.current)
      problematicHighlightTimerRef.current = null
    }
    for (const el of problematicHighlightedElsRef.current) {
      ;(el as SVGElement).style.removeProperty("filter")
    }
    problematicHighlightedElsRef.current = []
  }, [])

  // C-6b (2026-07-11): 旧「気になる箇所」譜面ジャンプ (handleJumpToProblematicPosition) は
  // 旧55アドバイス内の表示だったため退役。ハイライト解除機構は他機能が使うので温存。

  // unmount 時にタイマーを解放
  useEffect(() => {
    return () => {
      if (problematicHighlightTimerRef.current != null) {
        window.clearTimeout(problematicHighlightTimerRef.current)
      }
    }
  }, [])

  // --- 色塗りのみ（getBoundingClientRect 不要、即時実行可能）---
  // 波の演出 (1音ずつ最大800ms) は「演奏を選んで最初に塗る1回」だけ。
  // 譜面の描き直し後の貼り直しで毎回波が走ると点滅に見える (2026-08-06 真因特定) ため、
  // 同じ comparison の2回目以降は演出なしで即時に貼る。
  const wavePlayedForRef = useRef<unknown>(null)
  const applyComparisonColors = useCallback(() => {
    // 前回の遅延色付けタイマーを破棄 (演奏を素早く切替えると前の色が後から乗る問題を防止)
    colorTimersRef.current.forEach(clearTimeout)
    colorTimersRef.current = []
    const elements = noteElementsRef.current
    const container = document.getElementById("osmd-container")
    if (elements.length === 0 || !container) return
    elements.forEach(restoreNote)

    if (!comparison) return

    const prefersReduced = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const instant = prefersReduced || wavePlayedForRef.current === comparison
    wavePlayedForRef.current = comparison

    for (const c of comparison) {
      const osmdIdx = analysisIdxToOsmdIdx(c.note_index)
      if (osmdIdx < 0 || osmdIdx >= elements.length) continue
      const color = getComparisonColor(c)
      if (instant) {
        colorizeNote(elements[osmdIdx], color)
      } else {
        const delay = Math.min(osmdIdx * 18, 800)
        colorTimersRef.current.push(setTimeout(() => colorizeNote(elements[osmdIdx], color), delay))
      }
    }
  }, [comparison, analysisIdxToOsmdIdx])

  // 間違い音符オーバーレイ (実際に鳴った高さの赤い丸) は 2026-08-06 Tetsuo確定で廃止。
  // 譜面がごちゃつくため。ミスの方向 (上ずり/ぶら下がり) はカルテの🔍虫めがねが担う。

  // 色塗り: noteElementsVersion が変わるたびに即時実行
  useEffect(() => {
    if (noteElementsVersion >= 0 && playbackState === "stopped") {
      if (comparison) {
        applyComparisonColors()
      } else {
        noteElementsRef.current.forEach(restoreNote)
      }
    }
  }, [comparison, playbackState, applyComparisonColors, noteElementsVersion])

  // --- カーソル（縦線）操作 ---
  // 自動復旧の核心: cursor div は #osmd-container の子。OSMD が再描画
  //   (最小化/DevTools/リサイズ → container.innerHTML="" / osmd.render()) で
  //   cursor を DOM から消すことがある。旧実装は「ref があれば返す」だったため
  //   切り離された幽霊要素を返し続け、ハードリロードしないと復旧しなかった。
  //   → 「ref があり かつ まだ container に接続されていれば再利用、
  //     切り離されていれば作り直して再 append」に変更。
  //   updateRecordingCursor が毎フレーム本関数を呼ぶことで、OSMD が消しても
  //   次フレームで自動再生成され、ハードリロード不要で青線が復活する。
  const ensureCursor = useCallback(() => {
    const container = document.getElementById("osmd-container")
    if (!container) return null
    if (cursorRef.current && container.contains(cursorRef.current)) {
      return cursorRef.current
    }
    container.style.position = "relative"
    const cursor = document.createElement("div")
    cursor.className = styles.playbackCursor
    // 視覚ビート用の丸 (青い線の上端に載せ、拍位相で上下)
    const ball = document.createElement("div")
    ball.className = styles.beatBall
    cursor.appendChild(ball)
    beatBallRef.current = ball
    container.appendChild(cursor)
    cursorRef.current = cursor
    return cursor
  }, [])

  // 視覚ビート: 経過秒とテンポから拍位相を出し、丸を上下させる (表拍=下/裏拍=上)
  const updateBeatBall = useCallback((elapsedSec: number, bpm: number) => {
    const ball = beatBallRef.current
    if (!ball) return
    if (!metronomeOnRef.current || !bpm) { ball.style.opacity = "0"; return }
    const beatSec = 60 / bpm
    const phase = ((elapsedSec % beatSec) + beatSec) % beatSec / beatSec // 0..1
    const y = -18 * Math.sin(phase * Math.PI) // 0=下(表拍), 0.5=上(裏拍)
    ball.style.opacity = "1"
    ball.style.transform = `translateX(-50%) translateY(${y.toFixed(1)}px)`
  }, [])

  const updateCursorFromGNotes = useCallback((gNotes: any[] | null) => {
    const cursor = cursorRef.current
    if (!cursor) return
    if (!gNotes || gNotes.length === 0) {
      cursor.style.display = "none"
      return
    }
    const svgEl = gNotes[0].getSVGGElement?.()
    if (!svgEl) { cursor.style.display = "none"; return }

    const container = document.getElementById("osmd-container")
    if (!container) return

    const svgs = container.querySelectorAll("svg")
    let activeSvg: SVGSVGElement | null = null
    for (const svg of svgs) {
      if (svg.style.display !== "none") { activeSvg = svg; break }
    }
    if (!activeSvg || !activeSvg.contains(svgEl)) {
      cursor.style.display = "none"
      return
    }

    const containerRect = container.getBoundingClientRect()
    // cursor は position:absolute でコンテナ内配置 → top をコンテンツ座標で算出するため scrollTop を加算
    const scrollTop = container.scrollTop
    const noteRect = svgEl.getBoundingClientRect()
    const x = noteRect.left + noteRect.width / 2 - containerRect.left
    const noteMidY = noteRect.top + noteRect.height / 2

    // 五線の範囲を特定
    const staves = activeSvg.querySelectorAll("g.vf-stave")
    let staffTop = noteMidY - containerRect.top - 30 + scrollTop
    let staffHeight = 60

    let closestStave: Element | null = null
    let closestDist = Infinity
    for (const stave of staves) {
      const sr = stave.getBoundingClientRect()
      const staveMid = sr.top + sr.height / 2
      const dist = Math.abs(staveMid - noteMidY)
      if (dist < closestDist) { closestDist = dist; closestStave = stave }
    }
    if (closestStave) {
      const paths = closestStave.querySelectorAll("path")
      let lineMinY = Infinity, lineMaxY = -Infinity, foundLines = 0
      for (const path of paths) {
        const r = path.getBoundingClientRect()
        if (r.height <= 2 && r.width > 20) {
          lineMinY = Math.min(lineMinY, r.top)
          lineMaxY = Math.max(lineMaxY, r.bottom)
          foundLines++
        }
      }
      if (foundLines >= 3) {
        const margin = 8
        staffTop = lineMinY - containerRect.top - margin + scrollTop
        staffHeight = (lineMaxY - lineMinY) + margin * 2
      } else {
        const sr = closestStave.getBoundingClientRect()
        staffTop = sr.top - containerRect.top + scrollTop
        staffHeight = sr.height
      }
    }

    cursor.style.display = "block"
    cursor.style.left = `${x}px`
    cursor.style.top = `${staffTop}px`
    cursor.style.height = `${staffHeight}px`
  }, [])

  const hideCursor = useCallback(() => {
    if (cursorRef.current) cursorRef.current.style.display = "none"
  }, [])

  // --- 区間ハイライト帯の描画 (部分練習 Phase 1) ---
  // cursor と同じく #osmd-container 内にコンテンツ座標(scrollTop加算)で絶対配置し、スクロール追従させる。
  // 選択区間の音符を行ごとにまとめ、各行に半透明の帯を描く (行の切れ目は x が左へ戻ることで検出)。
  const renderRangeOverlay = useCallback(() => {
    const container = document.getElementById("osmd-container")
    if (!container) return
    // 既存の帯・ハンドル・マーカーを除去
    rangeBandsRef.current.forEach((b) => b.remove())
    rangeBandsRef.current = []
    if (rangeStart === null) return

    container.style.position = "relative"
    const cRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop

    // 開始タップのみ (終了待ち): 開始位置に細いバイオレットのマーカーを出して手応えを返す
    if (rangeEnd === null) {
      const el = noteElementsRef.current[rangeStart]
      if (el && container.contains(el)) {
        const r = el.getBoundingClientRect()
        if (r.width !== 0 || r.height !== 0) {
          const mark = document.createElement("div")
          mark.className = styles.rangeStartMark
          mark.style.left = `${(r.left + r.right) / 2 - cRect.left}px`
          mark.style.top = `${r.top - cRect.top + scrollTop - 9}px`
          mark.style.height = `${r.height + 18}px`
          container.appendChild(mark)
          rangeBandsRef.current.push(mark)
        }
      }
      return
    }

    const lo = Math.min(rangeStart, rangeEnd)
    const hi = Math.max(rangeStart, rangeEnd)

    type Band = { left: number; right: number; top: number; bottom: number }
    const bands: Band[] = []
    let cur: Band | null = null
    let prevCx = -Infinity
    for (let i = lo; i <= hi; i++) {
      const el = noteElementsRef.current[i]
      if (!el || !container.contains(el)) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const left = r.left - cRect.left
      const right = r.right - cRect.left
      const top = r.top - cRect.top + scrollTop
      const bottom = r.bottom - cRect.top + scrollTop
      const cx = (left + right) / 2
      if (!cur || cx < prevCx - 4) {
        cur = { left, right, top, bottom }
        bands.push(cur)
      } else {
        cur.left = Math.min(cur.left, left)
        cur.right = Math.max(cur.right, right)
        cur.top = Math.min(cur.top, top)
        cur.bottom = Math.max(cur.bottom, bottom)
      }
      prevCx = cx
    }

    const padX = 5
    const padY = 9
    for (const g of bands) {
      const b = document.createElement("div")
      b.className = styles.rangeBandSel
      b.style.left = `${g.left - padX}px`
      b.style.top = `${g.top - padY}px`
      b.style.width = `${g.right - g.left + padX * 2}px`
      b.style.height = `${g.bottom - g.top + padY * 2}px`
      container.appendChild(b)
      rangeBandsRef.current.push(b)
    }

    // 両端の丸ハンドル (選択モード中のみ)。開始=先頭音符の左端中央 / 終了=末尾音符の右端中央。
    // ドラッグで各端を伸縮できる。pointerdown はコンテナのリスナが data-range-handle で拾う。
    if (rangeMode) {
      const mkHandle = (idx: number, which: "start" | "end") => {
        const el = noteElementsRef.current[idx]
        if (!el || !container.contains(el)) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return
        const h = document.createElement("div")
        h.className = styles.rangeHandle
        h.setAttribute("data-range-handle", which)
        h.style.left = `${(which === "start" ? r.left : r.right) - cRect.left}px`
        h.style.top = `${(r.top + r.bottom) / 2 - cRect.top + scrollTop}px`
        container.appendChild(h)
        rangeBandsRef.current.push(h)
      }
      mkHandle(lo, "start")
      mkHandle(hi, "end")
    }
  }, [rangeStart, rangeEnd, rangeMode])

  // 選択変化・再描画(zoom等)・スクロール・リサイズで区間ハイライトを再配置
  useEffect(() => {
    renderRangeOverlay()
    const container = document.getElementById("osmd-container")
    if (!container) return
    let raf: number | null = null
    const schedule = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => { raf = null; renderRangeOverlay() })
    }
    container.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      container.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [renderRangeOverlay, noteElementsVersion, isOsmdReady])

  // --- 譜面再生のアニメーション ---
  const stopVisualSync = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (beatBallRef.current) beatBallRef.current.style.opacity = "0"
  }, [])

  const startVisualSync = useCallback(() => {
    if (!analysis) return
    ensureCursor()
    const loop = () => {
      const t = Tone.getTransport().seconds
      const ratio = activeTempoRatioRef.current
      const analysisTime = t / ratio

      // OSMDカーソルAPIベースのハイライト
      highlightNoteAtTime(analysisTime)

      // カーソル（縦線）の位置更新
      const gNotes = findNearestGNotes(analysisTime)
      updateCursorFromGNotes(gNotes)

      // 視覚ビート: 再生テンポの拍で上下 (transport秒の拍間隔 = 60/playbackTempo)
      updateBeatBall(t, playbackTempo)

      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
  }, [analysis, highlightNoteAtTime, findNearestGNotes, ensureCursor, updateCursorFromGNotes, updateBeatBall, playbackTempo])

  // --- テンポ比率ヘルパー ---
  const getTempoRatio = useCallback(() => {
    if (!analysis) return 1
    return analysis.bpm / playbackTempo
  }, [analysis, playbackTempo])

  // --- 譜面再生の完全停止 ---
  const stopPlayback = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    Tone.getTransport().loop = false // 区間ループを解除 (singleton の transport に残るため)
    stopVisualSync()
    clearHighlight()
    hideCursor()
    pausedAtRef.current = 0
    setIsRangeLooping(false)
    setPlaybackState("stopped")
    // 色復元 + オーバーレイ再描画は useEffect 経由で applyComparisonColors が担当
    // （playbackState → "stopped" の変化で発火する）
    // comparison が null の場合のみ即時復元
    if (!comparison) {
      noteElementsRef.current.forEach(restoreNote)
    }
  }, [comparison, stopVisualSync, clearHighlight, hideCursor])

  // --- 一時停止 ---
  const pausePlayback = useCallback(() => {
    pausedAtRef.current = Tone.getTransport().seconds
    Tone.getTransport().pause()
    stopVisualSync()
    setPlaybackState("paused")
  }, [stopVisualSync])

  // --- Partのセットアップ（共通） ---
  const setupPart = useCallback(async (startFromSec: number = 0, loop?: { start: number; end: number }) => {
    if (!analysis) return
    setPopover(null)
    await Tone.start()
    const transport = Tone.getTransport()
    transport.stop()
    transport.cancel()

    // 使う奏法の音源を先に読み込む。途中で読み込むと最初の数音が無音になる
    await preloadFor(analysis.notes)

    const tempoRatio = getTempoRatio()
    activeTempoRatioRef.current = tempoRatio

    // 2026-08-27: 奏法を持たせる。スタッカート等は長さ、トリル/トレモロは刻みで表現し、
    // ピチカートは別音源に切り替わる (violinSampler.playNote が判断する)。
    const playable = analysis.notes.filter((n) => n.type === "note" && n.pitches.length > 0)
    const events = playable.map((n, i) => ({
      time: Tone.Time(n.start_time_sec * tempoRatio, "s"),
      duration: Math.max((n.end_time_sec - n.start_time_sec) * tempoRatio, 0.05),
      frequency: n.pitches[0],
      art: {
        articulations: n.articulations,
        is_tremolo: n.is_tremolo,
        is_trill: n.is_trill,
        is_mordent: n.is_mordent,
      },
      // トリル/モルデントで交互に鳴らす相手 = 次の音符
      next: playable[i + 1]?.pitches?.[0] ?? null,
    }))

    if (partRef.current) partRef.current.dispose()
    partRef.current = new Tone.Part(
      (time, value: (typeof events)[number]) => {
        void playNote(
          Tone.Frequency(value.frequency).toNote(),
          value.duration,
          time,
          value.art,
          value.next ? Tone.Frequency(value.next).toNote() : null,
        )
      },
      events
    ).start(0)

    if (loop) {
      // 区間ループ: transport のネイティブ loop で [start, end] を繰り返す (Part のイベントは絶対時刻なので窓内のみ再発火)
      transport.loop = true
      transport.loopStart = loop.start
      transport.loopEnd = loop.end
    } else {
      transport.loop = false
      const lastNote = analysis.notes[analysis.notes.length - 1]
      const endTimeSec = lastNote ? lastNote.end_time_sec * tempoRatio + 0.5 : 10
      transport.schedule(() => stopPlayback(), `${endTimeSec}` as any)
    }

    transport.seconds = startFromSec
    lastHighlightedTimeRef.current = -1
    ensureCursor()
    transport.start()
    startVisualSync()
    setPlaybackState("playing")
  }, [analysis, getTempoRatio, startVisualSync, stopPlayback, ensureCursor, playbackTempo])

  // --- 再開 ---
  const resumePlayback = useCallback(async () => {
    await setupPart(pausedAtRef.current)
  }, [setupPart])

  // --- 先頭から再生 ---
  const startPlayback = useCallback(async () => {
    pausedAtRef.current = 0
    await setupPart(0)
  }, [setupPart])

  // --- 区間ループ再生 (部分練習 Phase 1) ---
  const startRangeLoop = useCallback(async () => {
    if (!analysis || rangeStart === null || rangeEnd === null) return
    const ratio = getTempoRatio()
    const lo = Math.min(rangeStart, rangeEnd)
    const hi = Math.max(rangeStart, rangeEnd)
    const s = analysis.notes[lo]
    const e = analysis.notes[hi]
    if (!s || !e) return
    const startSec = s.start_time_sec * ratio
    const endSec = e.end_time_sec * ratio
    if (endSec <= startSec) return
    if (playbackState === "playing") {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      stopVisualSync()
    }
    setIsRangeLooping(true)
    await setupPart(startSec, { start: startSec, end: endSec })
  }, [analysis, rangeStart, rangeEnd, getTempoRatio, setupPart, playbackState, stopVisualSync])

  // --- スコアクリックで任意位置から再生 / ポップオーバー表示 ---
  const handleScoreClick = useCallback(async (e: React.MouseEvent) => {
    if (!analysis) return
    if (recGuideAnimRef.current !== null) return // 録音中は無視
    // 区間選択モード中は、なぞり/ハンドル/タップを専用の pointer リスナ (下部) が担う。
    // クリック起点の再生ジャンプ/ポップオーバーは抑止する。
    if (rangeMode) return

    const elements = noteElementsRef.current
    if (elements.length === 0) return

    // 1. クリック座標に最も近いノート要素を特定
    const { idx: closestIdx, dist: closestDist } = nearestNoteIdx(e.clientX, e.clientY)

    const HIT_RADIUS = 40

    // 1.7 記号ガイド: 「譜面をタップして調べる」ON のときは再生ジャンプより優先。
    //    OFF (既定) では従来動作のままなので、通常の操作感は変わらない。
    if (symbolTapModeRef.current && closestDist <= HIT_RADIUS) {
      setPopover(null)
      symbolGuideRef.current?.openForNote(closestIdx)
      return
    }

    // 2. ポップオーバー分岐: 停止中 + 評価あり + ノート近傍
    if (playbackState === "stopped" && comparison && closestDist <= HIT_RADIUS) {
      const compNote = comparison.find(c => c.note_index === closestIdx)
      if (compNote) {
        const parentRect = scoreWrapperRef.current?.getBoundingClientRect()
        if (parentRect) {
          const noteRect = elements[closestIdx].getBoundingClientRect()
          const POPOVER_HEIGHT_EST = 80
          const POPOVER_HALF_WIDTH = 120
          let left = noteRect.left + noteRect.width / 2 - parentRect.left
          left = Math.max(POPOVER_HALF_WIDTH, Math.min(left, parentRect.width - POPOVER_HALF_WIDTH))
          let top = noteRect.top - parentRect.top - POPOVER_HEIGHT_EST - 8
          if (top < 0) {
            top = noteRect.bottom - parentRect.top + 8
          }
          setPopover({ note: compNote, left, top })
          return
        }
      }
      // compNote なし（休符等）→ フォールスルーして再生ジャンプ
    }

    // 3. 再生ジャンプ（既存動作）
    setPopover(null)
    const tempoRatio = getTempoRatio()
    const startSec = analysis.notes[closestIdx]
      ? analysis.notes[closestIdx].start_time_sec * tempoRatio
      : 0

    if (playbackState === "playing") {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      stopVisualSync()
    }

    await setupPart(startSec)
  }, [analysis, playbackState, comparison, getTempoRatio, setupPart, stopVisualSync, rangeMode, nearestNoteIdx])

  // --- 区間選択のポインタ操作 (なぞり=主 / 両端ハンドル / タップ) 2026-08-10 ---
  // rangeMode 中だけ #osmd-container に pointer リスナを張る。選択の"値"は既存の音符index
  // (rangeStart/rangeEnd) を使い、描画は既存の区間オーバーレイ (renderRangeOverlay) が担う。
  useEffect(() => {
    if (!rangeMode) return
    const container = document.getElementById("osmd-container")
    if (!container) return

    const MOVE_THRESH_SQ = 64 // 8px^2: これを超えたら「なぞり」とみなす
    const prevTouchAction = container.style.touchAction
    container.style.touchAction = "none" // ドラッグ中の縦スクロールを止める

    const onDown = (e: PointerEvent) => {
      const handleEl = (e.target as HTMLElement | null)?.closest?.("[data-range-handle]")
      dragMovedRef.current = false
      dragDownXYRef.current = { x: e.clientX, y: e.clientY }
      if (handleEl) {
        // 両端ハンドルの微調整ドラッグ (音符index単位・スナップなし)
        dragModeRef.current = handleEl.getAttribute("data-range-handle") === "start" ? "start" : "end"
      } else if (awaitingEndTapRef.current && rangeStartRef.current != null) {
        // 開始タップ済み → 今回の操作で終了を決める (なぞれば開始からドラッグ)
        dragModeRef.current = "extend"
        dragAnchorRef.current = rangeStartRef.current
      } else {
        // 新規の選択開始
        const { idx } = nearestNoteIdx(e.clientX, e.clientY)
        dragModeRef.current = "new"
        dragAnchorRef.current = idx
        setRangeStart(idx)
        setRangeEnd(null)
        awaitingEndTapRef.current = false
      }
      try { container.setPointerCapture(e.pointerId) } catch { /* noop */ }
      e.preventDefault()
    }

    const onMove = (e: PointerEvent) => {
      const mode = dragModeRef.current
      if (!mode) return
      const dx = e.clientX - dragDownXYRef.current.x
      const dy = e.clientY - dragDownXYRef.current.y
      if (dx * dx + dy * dy > MOVE_THRESH_SQ) dragMovedRef.current = true
      const { idx } = nearestNoteIdx(e.clientX, e.clientY)
      if (mode === "new" || mode === "extend") {
        if (!dragMovedRef.current) return // なぞりと確定するまで帯を出さない (タップ判定を優先)
        const a = dragAnchorRef.current
        const lo = Math.min(a, idx)
        const hi = Math.max(a, idx)
        // なぞり = 小節境界へスナップ (musically clean)
        setRangeStart(snapStart(lo))
        setRangeEnd(snapEnd(hi))
      } else if (mode === "start") {
        const end = rangeEndRef.current ?? idx
        setRangeStart(Math.min(idx, end))
      } else if (mode === "end") {
        const start = rangeStartRef.current ?? idx
        setRangeEnd(Math.max(idx, start))
      }
      e.preventDefault()
    }

    const onUp = (e: PointerEvent) => {
      const mode = dragModeRef.current
      dragModeRef.current = null
      try { container.releasePointerCapture(e.pointerId) } catch { /* noop */ }
      if (!mode) return
      if (mode === "new" && !dragMovedRef.current) {
        // 単タップ = 開始タップ (次のタップで終了を決める)
        awaitingEndTapRef.current = true
      } else if (mode === "extend" && !dragMovedRef.current) {
        // 2度目のタップ = 終了確定 (タップは音符index単位・スナップなし)
        const a = dragAnchorRef.current
        const { idx } = nearestNoteIdx(e.clientX, e.clientY)
        setRangeStart(Math.min(a, idx))
        setRangeEnd(Math.max(a, idx))
        awaitingEndTapRef.current = false
      } else {
        // なぞり確定 / ハンドル確定
        awaitingEndTapRef.current = false
      }
    }

    container.addEventListener("pointerdown", onDown)
    container.addEventListener("pointermove", onMove)
    container.addEventListener("pointerup", onUp)
    container.addEventListener("pointercancel", onUp)
    return () => {
      container.style.touchAction = prevTouchAction
      container.removeEventListener("pointerdown", onDown)
      container.removeEventListener("pointermove", onMove)
      container.removeEventListener("pointerup", onUp)
      container.removeEventListener("pointercancel", onUp)
    }
  }, [rangeMode, isOsmdReady, noteElementsVersion, nearestNoteIdx, snapStart, snapEnd])

  // 区間録音フローに入る (入口メニューの「区間録音」)。譜面を選択可能にし、下部シートを出す。
  const enterRangeFlow = useCallback(() => {
    setRecordMenuOpen(false)
    if (isRangeLooping) stopPlayback()
    awaitingEndTapRef.current = false
    setRangeStart(null)
    setRangeEnd(null)
    setRangeMode(true)
    setOpenPanel(null)
    // 選択対象の譜面を画面内へ寄せる
    document.getElementById("osmd-container")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [isRangeLooping, stopPlayback])

  // 区間録音フローを抜ける
  const exitRangeFlow = useCallback(() => {
    if (isRangeLooping) stopPlayback()
    awaitingEndTapRef.current = false
    setRangeMode(false)
    setRangeStart(null)
    setRangeEnd(null)
  }, [isRangeLooping, stopPlayback])

  // 「この区間を採点」: 既存の区間録音経路 (pendingRangeRef → recorder-start-button 合成クリック) を流用。
  // 原本 №03 脚注 「4小節目から 7小節目まで ・ 12秒」: 小節はmeasureMap ・ 秒はstart/end_time_sec
  const rangeSummary = useMemo(() => {
    if (rangeStart === null || rangeEnd === null || !analysis) return null
    const lo = Math.min(rangeStart, rangeEnd)
    const hi = Math.max(rangeStart, rangeEnd)
    const secRaw = (analysis.notes[hi]?.end_time_sec ?? 0) - (analysis.notes[lo]?.start_time_sec ?? 0)
    const sec = Math.max(1, Math.round(secRaw * getTempoRatio()))
    const mLo = measureMap?.ok ? measureMap.noteToMeasure[lo] : null
    const mHi = measureMap?.ok ? measureMap.noteToMeasure[hi] : null
    if (mLo != null && mHi != null) return `${mLo}小節目から ${mHi}小節目まで ・ ${sec}秒`
    return `えらんだ区間 ・ ${sec}秒`
  }, [rangeStart, rangeEnd, analysis, measureMap, getTempoRatio])

  const recordSelectedRange = useCallback(() => {
    if (rangeStartRef.current === null || rangeEndRef.current === null) return
    const lo = Math.min(rangeStartRef.current, rangeEndRef.current)
    const hi = Math.max(rangeStartRef.current, rangeEndRef.current)
    if (isRangeLooping) stopPlayback()
    pendingRangeRef.current = { from: lo, to: hi }
    noteElementsRef.current[lo]?.scrollIntoView({ behavior: "smooth", block: "center" })
    setRangeMode(false) // 録音に入るので選択UIは畳む (recordingRangeRef は onIdleRecordClick で確定)
    const btn = document.querySelector('[data-testid="recorder-start-button"]') as HTMLButtonElement | null
    btn?.click()
  }, [isRangeLooping, stopPlayback])

  // 入口メニューの「全て録音 (通し)」: 従来の通し録音経路をそのまま呼ぶ (pendingRange=null)。
  const recordFull = useCallback(() => {
    setRecordMenuOpen(false)
    pendingRangeRef.current = null
    const btn = document.querySelector('[data-testid="recorder-start-button"]') as HTMLButtonElement | null
    btn?.click()
  }, [])

  // --- 録音中ガイドカーソル ---
  const recGuideAnimRef = useRef<number | null>(null)
  const recGuideStartRef = useRef<number>(0)
  /** 1拍目 (楽譜の起点) が録音の何秒目か。アプリ版のみ値が入る (2026-08-27) */
  const guideOffsetSecRef = useRef<number | null>(null)

  // ▼ F-1 Commit 2: 譜面の行構造とスクロール計画
  // 2026-05-30 bugfix: ResizeObserver でコンテナサイズ変化を検知して rebuild。
  // 旧実装は window resize のみ依存だったため、録音開始で body[data-fullscreen=true]
  // が CSS で osmd-container のサイズを変えても (window 自体は resize しないため)
  // rebuild が走らず stale plan で scrollTop の clamp 値がズレていた。
  const [scrollPlan, setScrollPlan] = useState<ScrollPlan | null>(null)
  useEffect(() => {
    if (!isOsmdReady || !osmdRef.current || recordingBpm === null) return
    const container = document.getElementById("osmd-container")
    if (!container) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const buildPlan = () => {
      if (!osmdRef.current || recordingBpm === null) return
      const viewportHeight = container.clientHeight
      const plan = buildScrollPlan(osmdRef.current, recordingBpm, viewportHeight)
      setScrollPlan(plan)
    }
    const scheduleBuildPlan = () => {
      // OSMD autoResize の再描画完了を待ってから plan 計算する
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(buildPlan, 300)
    }

    buildPlan()  // 初回 (即時)
    const ro = new ResizeObserver(scheduleBuildPlan)
    ro.observe(container)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      ro.disconnect()
    }
  }, [isOsmdReady, recordingBpm])

  // ▼ F-1 Commit 4: 末尾到達自動停止トリガ (Recorder の停止ボタンを click)
  const triggerStopRecording = useCallback(() => {
    const button = document.querySelector(
      '[data-testid="recorder-stop-button"]',
    ) as HTMLButtonElement | null
    if (button) {
      button.click()
    } else {
      console.warn("[F-1] recorder stop button not found")
    }
  }, [])

  // ▼ F-1 Commit 6: 戻るボタン制御 (録音中 / countdown 中)
  useEffect(() => {
    if (recordingState !== "recording" && recordingState !== "countdown") return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "録音中です。中断しますか？"
      return e.returnValue
    }

    const handlePopState = () => {
      const confirmed = window.confirm("録音中です。中断しますか？")
      if (confirmed) {
        triggerStopRecording()
      } else {
        window.history.pushState(null, "", window.location.href)
      }
    }

    window.history.pushState(null, "", window.location.href)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [recordingState, triggerStopRecording])

  // 2026-05-30: 旧 F-1 Commit 6 の window resize / orientationchange ハンドラは
  // ResizeObserver ベースの scrollPlan effect に統合済 (= コンテナサイズ変化を直接検知)
  // → ここでの window 依存リスナは不要。

  // ▼ F-1 Commit 5: 短い譜面の場合は body[data-short-score=true] で上端揃え
  const isShortScore = scrollPlan?.isShortScore ?? false
  useEffect(() => {
    if (isShortScore) {
      document.body.setAttribute("data-short-score", "true")
    } else {
      document.body.removeAttribute("data-short-score")
    }
    return () => {
      document.body.removeAttribute("data-short-score")
    }
  }, [isShortScore])

  // ▼ F-1 Commit 3: 録音中の自動スクロール (短い譜面はスキップ、analysis null もスキップ)
  useEffect(() => {
    if (recordingState !== "recording") return
    // 9a帯モード中は縦スクロールは無意味 (横追従effectが担当)
    if (recBand) return
    // 区間録音では曲全体スクロールを止める (区間はハイライトで可視・カーソルは区間内で動く)。
    if (recordingRangeRef.current) return
    if (!scrollPlan || scrollPlan.isShortScore) return
    if (!analysis) return

    const container = document.getElementById("osmd-container")
    if (!container) return

    let rafId = 0
    const cursorOffsetRatio = 1 / 3
    const TAIL_BUFFER_SEC = 1.5

    const tick = () => {
      if (!recGuideStartRef.current) {
        rafId = requestAnimationFrame(tick)
        return
      }
      const elapsedSec = (performance.now() - recGuideStartRef.current) / 1000

      // F-1 Commit 4: 末尾到達後 1.5 秒で自動停止
      if (elapsedSec >= scrollPlan.totalDurationSec + TAIL_BUFFER_SEC) {
        triggerStopRecording()
        return
      }

      const located = locateInPlan(scrollPlan, elapsedSec)
      if (!located) return

      const viewportHeight = container.clientHeight
      const targetScrollTop = located.scrollTopPx - viewportHeight * cursorOffsetRatio
      const clampedScrollTop = Math.max(
        0,
        Math.min(targetScrollTop, scrollPlan.totalHeightPx - viewportHeight),
      )
      container.scrollTop = clampedScrollTop

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [recordingState, scrollPlan, analysis, triggerStopRecording, recBand])

  // ▼ 9a帯モード: ガイドカーソルのxに追従して横スクロールし、ガイド線を画面左10%に固定する。
  // カーソルは区間録音のオフセットも既に処理しているため、通し/区間/パートすべてこの1本で動く。
  // 通し録音の自動停止もここが担う (縦のscrollPlan経路は帯レイアウトではisShortScoreで無効のため)。
  useEffect(() => {
    if (!recBand || recordingState !== "recording") return
    const container = document.getElementById("osmd-container")
    if (!container) return

    let rafId = 0
    const GUIDE_RATIO = 0.10 // ガイド線の固定位置 = 画面左から10% (2026-08-15 Tetsuo指定)
    const TAIL_BUFFER_SEC = 1.5

    const tick = () => {
      const cursor = cursorRef.current
      if (cursor && cursor.style.display !== "none") {
        const x = parseFloat(cursor.style.left || "0")
        if (isFinite(x)) {
          const target = x - container.clientWidth * GUIDE_RATIO
          const max = Math.max(0, container.scrollWidth - container.clientWidth)
          container.scrollLeft = Math.max(0, Math.min(target, max))
        }
      }
      if (!recordingRangeRef.current && scrollPlan && scrollPlan.totalDurationSec > 0 && recGuideStartRef.current) {
        const elapsedSec = (performance.now() - recGuideStartRef.current) / 1000
        if (elapsedSec >= scrollPlan.totalDurationSec + TAIL_BUFFER_SEC) {
          triggerStopRecording()
          return
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [recBand, recordingState, scrollPlan, triggerStopRecording])

  // 録音中のガイドラインを前後ノート間で線形補間して横スライドさせる
  const updateRecordingCursor = useCallback((currentSec: number) => {
    // 毎フレーム ensureCursor: OSMD 再描画で cursor が DOM から消えても
    // ここで自動再生成され、ハードリロード不要で青線が復活する。
    const cursor = ensureCursor()
    if (!cursor) return
    const times = sortedTimes.current
    if (times.length === 0) return

    // 前後のノート index を二分探索
    let lo = 0, hi = times.length - 1
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (times[mid] < currentSec) lo = mid + 1
      else hi = mid
    }
    const nextIdx = times[lo] >= currentSec ? lo : Math.min(lo + 1, times.length - 1)
    const prevIdx = Math.max(0, nextIdx - 1)
    const prevTime = times[prevIdx]
    const nextTime = times[nextIdx]

    // 層1: 不変 Note 模型を取得 (再描画で不変)
    const prevNote = timeToSourceNote.current.get(prevTime)
    if (!prevNote) return

    const container = document.getElementById("osmd-container")
    if (!container) return

    const svgs = container.querySelectorAll("svg")
    let activeSvg: SVGSVGElement | null = null
    for (const svg of svgs) {
      if (svg.style.display !== "none") { activeSvg = svg as SVGSVGElement; break }
    }
    if (!activeSvg) return

    // 層2: 毎フレーム osmd.rules.GNote(不変Note) で現在の SVG をライブ解決。
    //   再描画されても NoteToGraphicalNoteMap は再構築済のため常に最新を返す。
    // osmd.rules は protected。公開 getter osmd.EngravingRules 経由で GNote を呼ぶ。
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const osmdRules: any = osmdRef.current?.EngravingRules
    const prevGN = osmdRules?.GNote?.(prevNote)
    const prevSvg = prevGN?.getSVGGElement?.() as SVGGElement | undefined
    // 追加指示1: ライブ解決失敗 (再描画中の数 ms の null 等) は
    //   display:none にせず return → 直前フレームの位置を維持し青線を消さない。
    if (!prevSvg || !activeSvg.contains(prevSvg)) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    // cursor は position:absolute でコンテナ内配置 → top/left はコンテンツ座標
    // viewport 相対の rect を + scrollTop / + scrollLeft でコンテンツ相対に変換
    // (scrollLeft は縦レイアウトでは常に0=挙動不変。9a帯モードの横スクロールで必要)
    const scrollTop = container.scrollTop
    const scrollLeft = container.scrollLeft
    const prevRect = prevSvg.getBoundingClientRect()
    const prevX = prevRect.left + prevRect.width / 2 - containerRect.left + scrollLeft

    // 前後ノートが同じ段なら x を線形補間、改段を跨ぐなら prev 位置に固定
    let x = prevX
    const nextNote = timeToSourceNote.current.get(nextTime)
    if (nextNote && nextTime > prevTime) {
      // 層2: next も同様にライブ解決
      const nextSvg = osmdRules?.GNote?.(nextNote)?.getSVGGElement?.() as SVGGElement | undefined
      if (nextSvg && activeSvg.contains(nextSvg)) {
        const nextRect = nextSvg.getBoundingClientRect()
        const sameRow = Math.abs(prevRect.top - nextRect.top) < 20
        if (sameRow) {
          const nextX = nextRect.left + nextRect.width / 2 - containerRect.left + scrollLeft
          const progress = Math.max(0, Math.min(1, (currentSec - prevTime) / (nextTime - prevTime)))
          x = prevX + (nextX - prevX) * progress
        }
      }
    }

    // 五線の範囲を特定 (updateCursorFromGNotes と同じロジック)
    const noteMidY = prevRect.top + prevRect.height / 2
    const staves = activeSvg.querySelectorAll("g.vf-stave")
    let staffTop = noteMidY - containerRect.top - 30 + scrollTop
    let staffHeight = 60

    let closestStave: Element | null = null
    let closestDist = Infinity
    for (const stave of staves) {
      const sr = stave.getBoundingClientRect()
      const staveMid = sr.top + sr.height / 2
      const dist = Math.abs(staveMid - noteMidY)
      if (dist < closestDist) { closestDist = dist; closestStave = stave }
    }
    if (closestStave) {
      const paths = closestStave.querySelectorAll("path")
      let lineMinY = Infinity, lineMaxY = -Infinity, foundLines = 0
      for (const path of paths) {
        const r = path.getBoundingClientRect()
        if (r.height <= 2 && r.width > 20) {
          lineMinY = Math.min(lineMinY, r.top)
          lineMaxY = Math.max(lineMaxY, r.bottom)
          foundLines++
        }
      }
      if (foundLines >= 3) {
        const margin = 8
        staffTop = lineMinY - containerRect.top - margin + scrollTop
        staffHeight = (lineMaxY - lineMinY) + margin * 2
      } else {
        const sr = closestStave.getBoundingClientRect()
        staffTop = sr.top - containerRect.top + scrollTop
        staffHeight = sr.height
      }
    }

    cursor.style.display = "block"
    cursor.style.left = `${x}px`
    cursor.style.top = `${staffTop}px`
    cursor.style.height = `${staffHeight}px`
  }, [ensureCursor])

  const startRecordingGuide = useCallback(() => {
    if (!analysis) return
    ensureCursor()
    recGuideStartRef.current = performance.now()

    const loop = () => {
      const elapsedRealSec = (performance.now() - recGuideStartRef.current) / 1000
      // 区間録音(2c): 区間終端 + バッファに達したら自動停止 (全体録音は Infinity で発火しない)
      if (elapsedRealSec >= recGuideStopAtRealSecRef.current) {
        triggerStopRecording()
        return
      }
      // ユーザー録音テンポで再生位置をスケール:
      // recordingBpm=60, analysis.bpm=120 なら、実時間 1 秒 = 楽譜時間 0.5 秒
      // (ゆっくり録音するほど、カーソルもゆっくり進む)
      const recBpm = recordingBpmRef.current || analysis.bpm
      // 区間録音では区間先頭ノートの開始秒をオフセットとして加算 → カーソルが区間から始まる
      const scoreTimeSec = recGuideOffsetSecRef.current + elapsedRealSec * (recBpm / analysis.bpm)
      // 一過性の例外 (OSMD再描画中のDOM入れ替え等) でRAF連鎖が死ぬとガイドが永久凍結するため隔離する
      try {
        updateRecordingCursor(scoreTimeSec)
        // 視覚ビート: 録音テンポの拍で上下 (実経過秒の拍間隔 = 60/recBpm)
        updateBeatBall(elapsedRealSec, recBpm)
      } catch (e) {
        console.warn("recording guide frame error:", e)
      }
      recGuideAnimRef.current = requestAnimationFrame(loop)
    }
    recGuideAnimRef.current = requestAnimationFrame(loop)
  }, [analysis, ensureCursor, updateRecordingCursor, updateBeatBall, triggerStopRecording])

  const stopRecordingGuide = useCallback(() => {
    if (recGuideAnimRef.current) {
      cancelAnimationFrame(recGuideAnimRef.current)
      recGuideAnimRef.current = null
    }
    hideCursor()
  }, [hideCursor])

  // --- ESCキーでポップオーバーを閉じる ---
  useEffect(() => {
    if (!popover) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [popover])

  // --- クリーンアップ ---
  useEffect(() => {
    return () => {
      stopVisualSync()
      if (recGuideAnimRef.current) cancelAnimationFrame(recGuideAnimRef.current)
      colorTimersRef.current.forEach(clearTimeout)
      colorTimersRef.current = []
      try {
        Tone.getTransport().stop()
        Tone.getTransport().cancel()
      } catch { /* ignore */ }
      // Tone.js の音声ノードを破棄 (未破棄だと遷移毎に Destination に接続が残りリーク)
      try {
        partRef.current?.dispose(); partRef.current = null
        // サンプラーはモジュールで使い回している共有インスタンス。
        // dispose すると次に開いた画面で無音になるので、鳴っている音を止めるだけにする。
        // サンプラーはモジュールで使い回している共有インスタンス。
        // dispose すると次に開いた画面で無音になるので、鳴っている音を止めるだけにする。
        releaseViolin()
      } catch { /* ignore */ }
    }
  }, [stopVisualSync])

  // ふりかえりタブ用ブロック (Step 1: 構成再編 2026-07-18 — 履歴/採点結果/上達ループを1タブに集約)
  const deleteHintBlock = !practiceItemId && !selected && recentlyDeleted && (
    <div className={styles.deleteHint} role="status">
      演奏を削除しました。履歴から別の演奏を選んでください。
    </div>
  )
  // 上達の推移 (上達のようす)。個別演奏の一覧はこの下に「すべての演奏を見る」で畳む。
  // パート分け (2026-07-26): パートを選ぶと、そのパートの音符範囲を区間として確定 (次の録音が部分採点+partId付与)。
  const selectPart = (part: Part | null) => {
    if (!part || !analysis) {
      setSelectedPartId(null)
      pendingPartIdRef.current = null
      pendingRangeRef.current = null
      setRangeStart(null)
      setRangeEnd(null)
      return
    }
    const nr = resolvePartToNoteRange(part, analysis.notes)
    if (!nr) return // このアレンジには該当小節の音符が無い
    setSelectedPartId(part.id)
    pendingPartIdRef.current = part.id
    pendingRangeRef.current = { from: nr.rangeFromNote, to: nr.rangeToNote }
    setRangeStart(nr.rangeFromNote)
    setRangeEnd(nr.rangeToNote)
  }

  // 練習前シートで選んだパートを初期選択する (?part=<id>)。2026-08-25 確定。
  // 解析データが揃ってから1回だけ実行する。
  const partAppliedRef = useRef(false)
  useEffect(() => {
    if (partAppliedRef.current || !analysis || parts.length === 0) return
    const want = new URLSearchParams(window.location.search).get("part")
    if (!want) { partAppliedRef.current = true; return }
    const hit = parts.find((p) => p.id === want)
    if (hit) selectPart(hit)
    partAppliedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, parts])
  // パート別 自己ベスト (partId 一致の区間録音の最高点)
  const partBest = (pid: string): number | null => {
    const ss = performances
      .filter((p) => p.partId === pid && p.pitchAccuracy != null && p.timingAccuracy != null)
      .map((p) => performanceScore(p))
      .filter((s): s is number => s != null)
    return ss.length ? Math.max(...ss) : null
  }

  // ── 祝い体験 v2.0 (§2): バナー → 振り返りを開いた瞬間に祝い(通常機能・常時有効) ──
  const [celebShown, setCelebShown] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const shown = new Set<string>()
      for (const p of performances) {
        if (sessionStorage.getItem(`celebShown:${p.id}`) === "1") shown.add(p.id)
      }
      if (shown.size) setCelebShown((s) => new Set([...s, ...shown]))
    } catch {}
  }, [performances])
  // milestone(Python導出) に加え、自己ベスト(過去最高更新)をフロントで合成する (§1・personal_best)。
  const celebration = useMemo(() => {
    // 評価済み通し演奏を古い順に見て「その時点で過去最高を超えたか」を判定 (初回は対象外)。
    const fulls = performances
      .filter((p) => p.rangeFromNote == null && p.pitchAccuracy != null && p.timingAccuracy != null)
      .slice()
      .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    const bestFlag = new Map<string, boolean>()
    let prevMax = -Infinity
    let hasPrior = false
    for (const p of fulls) {
      const s = performanceScore(p) ?? 0
      bestFlag.set(p.id, hasPrior && s > prevMax)
      if (s > prevMax) prevMax = s
      hasPrior = true
    }
    // 候補 = milestoneイベントあり or 自己ベスト。公開時刻カットオフより後の演奏に限る(遡及発火の遮断)。最新を採用。
    const cands = performances
      .filter((p) =>
        p.analysisStatus === "done" &&
        new Date(p.uploadedAt).getTime() >= CELEBRATION_SINCE_MS &&
        (parseMilestoneEvents(p.analysisSummary).length > 0 || bestFlag.get(p.id)))
      .slice()
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    const perf = cands[0] ?? null
    if (!perf) return { perf: null, events: [] }
    const events = parseMilestoneEvents(perf.analysisSummary)
    if (bestFlag.get(perf.id)) events.push({ type: "personal_best", tier: "medium", payload: {} })
    return { perf, events }
  }, [performances])
  const celebrationPerf = celebration.perf
  // celebEvents は全画面祝い削除により未使用 (2026-08-12)
  const celebAlreadyShown = !celebrationPerf || celebShown.has(celebrationPerf.id)
  const closeCelebration = useCallback(() => {
    const perf = celebrationPerf
    if (!perf) return
    try { sessionStorage.setItem(`celebShown:${perf.id}`, "1") } catch {}
    setCelebShown((s) => new Set(s).add(perf.id))
    fetch("/api/celebrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(practiceItemId ? { practiceItemId } : { scoreId: score.id }),
    }).catch(() => {})
  }, [celebrationPerf, practiceItemId, score.id])

  // 吹き出しの既読仕様 (2026-08-16 Tetsuo指定): ふりかえりタブを一度でも見たら「採点を見た」
  // とみなし、タブを離れた時点で既読化する (祝い演出はタブ滞在中に通常どおり動ける)。
  // 新しい録音の採点完了は別perfIdなので、吹き出しは改めて表示される。
  const prevTabForCelebRef = useRef(activeTab)
  useEffect(() => {
    if (prevTabForCelebRef.current === "review" && activeTab !== "review" && celebrationPerf && !celebAlreadyShown) {
      closeCelebration()
    }
    prevTabForCelebRef.current = activeTab
  }, [activeTab, celebrationPerf, celebAlreadyShown, closeCelebration])

  const trajectoryBlock = <ProgressTrajectory performances={performances} />
  // 2026-08-22 Tetsuo指示: 演奏履歴カードは画面から撤去 (過去へのアクセスは
  // 上達のようすのグラフ点タップに一本化)。定義は復帰に備えて保持。
  const performanceHistoryBlock = (
    <div data-onboarding="scoreDetail.performanceHistory">
      <PerformanceHistory
        performances={performances}
        selectedId={selected?.id ?? null}
        onSelect={handleSelectPerformance}
        loading={perfLoading}
        performanceCount={performanceCount}
        kind={practiceItemId ? "practice" : "score"}
        onRenamed={handleRenamed}
        canShareToTeacher={studentHasTeacher}
        onReplayArco={practiceItemId ? undefined : (p) => setArcoResult(p)}
        renderDetail={(p) => (
          (p.pitchAccuracy != null || p.timingAccuracy != null)
            ? (
              <>
                <EvaluationSummaryCard performance={p} warnings={p.comparisonWarnings ?? []} />
                {/* この演奏の実測塗り指板 (2026-08-11): 統計判定なし・高低正をそのまま塗る */}
                {fingerNotes && (p.comparisonResult?.length ?? 0) > 0 && (
                  <SinglePerfFingerboard fingerNotes={fingerNotes} comparison={p.comparisonResult!} />
                )}
              </>
            )
            : null
        )}
        renderRowMenu={(p) => (
          <RowDeleteButton
            performanceId={p.id}
            kind={practiceItemId ? "practice" : "score"}
            onDeleted={handlePerformanceDeleted}
          />
        )}
        onPerformanceDeleted={handlePerformanceDeleted}
      />
    </div>
  )

  return (
    <div className={styles.container} data-section="score-detail-root">
      {/* F-1: フルスクリーン中の操作ガイドバー (Recorder の停止ボタンは leftColumn 内で非表示のため、戻るボタンを案内) */}
      {isFullscreen && (recBand ? (
        /* 帯モード: 原本 s04 №07 のボトム操作列 (たて画面にもどす ・ 赤丸66停止 ・ ♩bpm金) */
        <div data-section="fullscreen-bar">
          <button type="button" data-fs-exit onClick={triggerStopRecording}>たて画面にもどす</button>
          <button type="button" data-fs-stop onClick={triggerStopRecording} aria-label="録音を停止">停止</button>
          <span data-fs-meta>
            {recordingState === "recording" && (
              <span data-fs-timer>{`${Math.floor(bandElapsedSec / 60)}:${String(bandElapsedSec % 60).padStart(2, "0")}`}</span>
            )}
            <span data-fs-bpm>♩{recordingBpm}</span>
          </span>
        </div>
      ) : (
        <div data-section="fullscreen-bar">
          <span data-fs-hint>録音中… 弾き終えたら停止</span>
          <button type="button" data-fs-stop onClick={triggerStopRecording} aria-label="録音を停止">
            <span data-fs-sq /> 停止
          </button>
        </div>
      ))}
      {/* UI-6: 削除完了トースト (3 秒で自動消去) */}
      {deleteToast && (
        <div className={styles.deleteToast} role="status" aria-live="polite">
          {deleteToast}
        </div>
      )}
      <div className={styles.header} data-section="header">
        {/* 原本 HEADER .back: ‹ ライブラリ (教材詳細は ‹ カテゴリ名 ・ score-15) */}
        <Link
          href={backHref ?? `/${userId}/library?tab=${practiceItemId ? "basics" : "pieces"}`}
          style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }}
        >
          ‹ {backLabel ?? "ライブラリ"}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 100%", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <h1 className={styles.title}>{score.title}</h1>
            <MasterBadge kind={score.badge} size="md" />
            {cleared && (
              <span style={{ flex: "none", fontSize: 10, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "3px 9px", lineHeight: 1.2 }}>クリア</span>
            )}
          </div>
          <FavoriteButton
            scoreId={practiceItemId ? undefined : score.id}
            practiceItemId={practiceItemId}
            initialOn={!!initialFavorite}
          />
        </div>
        {subTitle && <div className={styles.subT}>{subTitle}</div>}
      </div>

      {/* タブ (演奏 / ふりかえり): 曲・練習アイテムの両方で表示。
          演奏履歴はふりかえり側に集約。上達ループは曲のみ (下の isScoreMode ガード)。 */}
      <div data-section="score-tabs" style={{ marginBottom: 12, position: "relative", marginTop: celebrationPerf && !celebAlreadyShown && activeTab !== "review" ? 34 : 0 }}>
        {/* 祝い吹き出し (§2.1 2026-08-16 吹き出し化): ふりかえりタブの真上にコンパクト表示。
            ふりかえりタブを開いている間は非表示 (開けば祝い演出→closeCelebrationで既読化される) */}
        {celebrationPerf && !celebAlreadyShown && activeTab !== "review" && (
          <CelebrationBanner onOpen={() => handleTabChange("review")} />
        )}
        <ScoreDetailTabs activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {activeTab === "play" && (
      <div className={styles.playStack} data-section="play-tab">
        {infoSlot}

        {/* パート練習 (曲にパートがある時のみ)。選ぶとその範囲だけを録音・部分採点し partId を付与。
            右に各パートの自己ベスト。おすすめ非表示・点数のみは振り返り側の仕様 (2026-07-26)。 */}
        {isScoreMode && parts.length > 0 && analysis && (
          <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 12, padding: "11px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Target size={14} color="#2563EB" /> パート練習</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <button
                type="button"
                onClick={() => selectPart(null)}
                style={{
                  border: `1.5px solid ${selectedPartId == null ? "#2e8b57" : "#e3e9f0"}`,
                  background: selectedPartId == null ? "#eef7f1" : "#fff",
                  color: "var(--text-ink)", borderRadius: 999, padding: "6px 12px", fontSize: "var(--fs-body)", fontWeight: 700, cursor: "pointer",
                }}
              >
                通し
              </button>
              {parts.map((p) => {
                const resolvable = resolvePartToNoteRange(p, analysis.notes) != null
                const best = partBest(p.id)
                const on = selectedPartId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!resolvable}
                    onClick={() => selectPart(p)}
                    title={resolvable ? "" : "この難易度には該当小節がありません"}
                    style={{
                      border: `1.5px solid ${on ? "#2e8b57" : "#e3e9f0"}`,
                      background: on ? "#eef7f1" : "#fff",
                      color: resolvable ? "#2b3742" : "#b3bcc6",
                      borderRadius: 999, padding: "6px 12px", fontSize: "var(--fs-body)", fontWeight: 700,
                      cursor: resolvable ? "pointer" : "not-allowed",
                      display: "inline-flex", alignItems: "center", gap: 7,
                    }}
                  >
                    <span>{p.name}</span>
                    {best != null && (
                      <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)" }}>{best}点</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedPartId != null && (
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 7, lineHeight: 1.6 }}>
                パート練習は「できるまでくり返す」ための練習モード。<b>あえて採点はひかえめ</b>にして、
                点数や曲の達成には数えないよ。
              </div>
            )}
          </div>
        )}

        {/* パート振り返り: 選択中パートの推移のみ (おすすめ教材/学びポイントは出さない・点数のみ)。2026-07-26 */}
        {isScoreMode && selectedPartId != null && (
          <div style={{ marginBottom: 10 }}>
            <ProgressTrajectory performances={performances} partId={selectedPartId} title="このパートの上達" />
          </div>
        )}

        {/* 過去の演奏セレクタ: 選ぶと譜面にその演奏のフィードバックを色表示 + 右にスコア。名前編集も。 */}
        {performances.length > 0 && (
          <div className={styles.perfSelectRow} data-fullscreen-hide>
            {renamingId && selected && renamingId === selected.id ? (
              <>
                <input
                  className={styles.perfRenameInput}
                  value={renameDraft}
                  maxLength={PERFORMANCE_NAME_MAX}
                  autoFocus
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename()
                    else if (e.key === "Escape") setRenamingId(null)
                  }}
                  disabled={renameSaving}
                />
                <button className={styles.perfSaveBtn} onClick={submitRename} disabled={renameSaving}>保存</button>
                <button className={styles.perfCancelBtn} onClick={() => setRenamingId(null)}>取消</button>
              </>
            ) : (
              <>
                <select
                  className={styles.perfSelect}
                  value={selected?.id ?? ""}
                  onChange={(e) => selectPerformanceById(e.target.value || null)}
                  style={selected ? { color: "var(--gold)" } : undefined} /* 原本 №04: 選択中の演奏名=金 */
                >
                  <option value="">演奏モード・演奏を選ぶと採点を表示</option>
                  {performances.map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.name ?? "Performance")}{p.rangeFromNote != null ? "" : ""} ・ {new Date(p.uploadedAt).toLocaleDateString("ja-JP")}
                    </option>
                  ))}
                </select>
                {selected && (() => {
                  const sc = performanceScore(selected)
                  return (
                    <span className={styles.perfSelectScore}>
                      {sc != null ? (
                        <span style={{ color: rankLabels[getScoreRank(sc)].color }}>{sc}<small>点</small></span>
                      ) : (
                        <span style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>採点中…</span>
                      )}
                    </span>
                  )
                })()}
                {selected && (
                  <button
                    className={styles.perfRenameBtn}
                    onClick={() => { setRenamingId(selected.id); setRenameDraft(selected.name ?? "") }}
                    title="この演奏の名前を編集"
                    aria-label="名前を編集"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 譜面ヒーロー (全幅・最上部) — UX刷新 Step 3 */}
        <div ref={scoreWrapperRef} style={{ position: "relative" }} data-onboarding="scoreDetail.scoreOverlay" data-section="score-hero">
          <ScoreViewer
            buildUrl={buildUrl}
            onNoteElementsReady={handleNoteElementsReady}
            onOsmdReady={handleOsmdReady}
            onScoreClick={handleScoreClick}
            onPageChange={() => setPopover(null)}
            forceExpand={isFullscreen || rangeMode || scoreExpand}
            expandMode={scoreExpand}
            onToggleExpand={() => setScoreExpand((v) => !v)}
            bandMode={recBand}
            onBandReady={onBandReady}
            freezeLayout={isFullscreen}
          />
          {popover && (
            <div
              className={styles.notePopover}
              style={{
                left: popover.left,
                top: popover.top,
                borderLeftColor: getComparisonColor(popover.note),
              }}
            >
              <NotePopoverContent note={popover.note} />
            </div>
          )}
        </div>

        {/* 出どころの曲にもどる (原本 score-15 ITEM: 学びポイント経由の往復導線) */}
        {fromScore && (
          <Link
            href={`/${userId}/scores/${fromScore.id}`}
            className={styles.card + " pressable"}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", textDecoration: "none", color: "inherit" }}
          >
            <span aria-hidden style={{ width: 30, height: 30, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(127,164,232,.14)", border: "1px solid rgba(127,164,232,.26)", color: "#7fa4e8", fontSize: 12 }}>♪</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13, color: "var(--text-ink)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fromScore.title}にもどる</b>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>この曲の学びのポイントから来たよ</span>
            </span>
            <span aria-hidden style={{ color: "var(--text-sub)", fontWeight: 800 }}>→</span>
          </Link>
        )}

        {/* 記号ガイド: 譜面に出てくる記号・技法をタップで説明 (2026-07-25) */}
        {analysis && (
          <div data-onboarding="scoreDetail.symbolGuide">
            <SymbolGuide
              userId={userId}
              symbols={scoreSymbols.list}
              byNote={scoreSymbols.byNote}
              noteElementsRef={noteElementsRef}
              noteElementsVersion={noteElementsVersion}
              tapMode={symbolTapMode}
              onTapModeChange={setSymbolTapMode}
              ref={symbolGuideRef}
            />
          </div>
        )}

        {/* 判定カラーの凡例: 演奏を選択して譜面に採点色が出ている時にスコア直下へ */}
        {selected && <ScoreLegend />}

        {/* 採点カルテのひとこと (2026-08-06統一): 先生が「カルテを返す」で書いたコメント */}
        {teacherComment && (
          <div style={{ border: "1.5px solid #eed9a0", background: "linear-gradient(150deg,#fffdf6,#fdf6e6)", borderRadius: 12, padding: "9px 13px", margin: "10px 0 4px" }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, letterSpacing: ".12em", color: "var(--text-master)", display: "flex", alignItems: "center", gap: 5 }}>
              <PenLine size={12} /> {teacherNameForKarte ? `${teacherNameForKarte}先生` : "先生"}の採点カルテ
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-ink)", marginTop: 3, lineHeight: 1.7 }}>「{teacherComment}」</div>
          </div>
        )}

        {/* 先生の添削を録音/練習の譜面に重ねて表示 (readOnly・トグル・2026-08-01) */}
        {analysis && hasTeacherFeedback && (
          <button
            type="button"
            onClick={() => setShowTeacherFeedback((v) => !v)}
            aria-pressed={showTeacherFeedback}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, margin: "0 0 8px",
              fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer",
              color: showTeacherFeedback ? "#fff" : "#3b56d4",
              background: showTeacherFeedback ? "#4a6cf7" : "#eef1fe",
              border: `1px solid ${showTeacherFeedback ? "#4a6cf7" : "#d6ddff"}`,
              borderRadius: 999, padding: "6px 13px",
            }}
          >
<PenLine size={13} /> 先生の添削を{showTeacherFeedback ? "隠す" : "譜面に表示"}
          </button>
        )}
        {analysis && showTeacherFeedback && (
          <AnnotationLayer
            readOnly
            containerId="osmd-container"
            noteElementsRef={noteElementsRef}
            noteElementsVersion={noteElementsVersion}
            scoreId={practiceItemId ? undefined : score.id}
            practiceItemId={practiceItemId}
            loadOverride={loadTeacherFeedback}
          />
        )}

        {/* 譜面注釈 (Phase 1): ハイライト/メモ/注意を譜面に書き込み・保存 */}
        {analysis && (
          <AnnotationLayer
            containerId="osmd-container"
            noteElementsRef={noteElementsRef}
            noteElementsVersion={noteElementsVersion}
            scoreId={practiceItemId ? undefined : score.id}
            practiceItemId={practiceItemId}
          />
        )}

        {/* 演奏バー: お手本 / テンポ / メトロノーム / 区間 を1本に統合 — UX刷新 Step 2 */}
        {analysis && (
          <div className={styles.playBar} data-onboarding="scoreDetail.playControls">
            <div className={styles.playBarRow}>
              <button
                type="button"
                className={`${styles.barCell} ${playbackState === "playing" ? styles.barCellOn : ""}`}
                onClick={() => {
                  if (playbackState === "playing") pausePlayback()
                  else if (playbackState === "paused") resumePlayback()
                  else startPlayback()
                }}
                disabled={recordingState === "recording" || recordingState === "countdown"}
                aria-label="お手本 再生/一時停止"
              >
                {playbackState === "playing" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--gold)" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--gold)" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                )}
                <span className={styles.barLabel}>お手本</span>
              </button>

              <button
                type="button"
                className={`${styles.barCell} ${openPanel === "tempo" ? styles.barCellActive : ""}`}
                onClick={() => setOpenPanel((p) => (p === "tempo" ? null : "tempo"))}
                aria-expanded={openPanel === "tempo"}
              >
                <span className={styles.barTempo}>♩{playbackTempo}</span>
                <span className={styles.barLabel}>テンポ</span>
              </button>

              <button
                type="button"
                className={`${styles.barCell} ${metronomeOn ? styles.barCellOn : ""}`}
                onClick={() => setMetronomeOn((v) => !v)}
                aria-pressed={metronomeOn}
                aria-label="メトロノーム"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 21h12L15 4H9L6 21z" /><path d="M12 8l4 8" /></svg>
                <span className={styles.barLabel}>メトロ{metronomeOn ? "・ON" : ""}</span>
              </button>
              {/* 区間ループ/採点は「録音ボタン → 区間録音」フローへ移設 (2026-08-10)。
                  ここの区間セル+二重パネルは撤去した。 */}
            </div>

            {openPanel === "tempo" && (
              <div className={styles.barPanel}>
                {(() => {
                  const tMin = Math.max(Math.round(analysis.bpm * 0.25), 20)
                  const tMax = Math.round(analysis.bpm * 2)
                  const busy = playbackState === "playing" || recordingState === "recording" || recordingState === "countdown"
                  const set = (v: number) => setPlaybackTempo(Math.min(tMax, Math.max(tMin, v)))
                  const pct = ((playbackTempo - tMin) / Math.max(1, tMax - tMin)) * 100
                  return (
                    <div className={styles.tempoControl}>
                      <div className={styles.tempoMain}>
                        <button type="button" className={styles.stepBtn} onClick={() => set(playbackTempo - 1)} disabled={busy || playbackTempo <= tMin} aria-label="遅く">−</button>
                        <div className={styles.tempoCenter}>
                          <span className={styles.tempoNum}>{playbackTempo}</span>
                          <span className={styles.tempoUnit}>BPM</span>
                          <button type="button" className={styles.resetBtn} onClick={() => set(analysis.bpm)} disabled={busy} title="原速に戻す" aria-label="原速に戻す">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
                          </button>
                        </div>
                        <button type="button" className={styles.stepBtn} onClick={() => set(playbackTempo + 1)} disabled={busy || playbackTempo >= tMax} aria-label="速く">＋</button>
                      </div>
                      <input
                        type="range" min={tMin} max={tMax} value={playbackTempo}
                        onChange={(e) => set(Number(e.target.value))}
                        disabled={busy}
                        className={styles.tempoSlider}
                        style={{ background: `linear-gradient(to right, var(--tempo-accent,#4a6cf7) ${pct}%, #e6e4ea ${pct}%)` }}
                      />
                      <div className={styles.tempoScale}><span>{tMin}</span><span>{tMax}</span></div>
                    </div>
                  )
                })()}
              </div>
            )}

          </div>
        )}

        {/* 現在のレベル（直近5回の総合点平均）— 録音の直前に可視化 */}
        {recordingState === "idle" && recentLevel && (
          <div
            style={{
              // モック level_rec: 窪み(inset) + 状態語 + クリームの大数字
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 15px",
              marginTop: 14,
              borderRadius: 14,
              background: "var(--card-in)",
              border: "1px solid rgba(150,175,225,.08)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-sub)" }}>現在のレベル</div>
              <b style={{ fontSize: 13, color: "#7fa4e8" }}>{rankLabels[getScoreRank(recentLevel.avg)].label}</b>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span
                data-anim="count"
                style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, color: "var(--cream)", fontVariantNumeric: "tabular-nums", textShadow: "0 0 24px rgba(255,243,220,.28)" }}
              >
                {recentLevel.avg}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-sub)" }}>点</span>
            </div>
          </div>
        )}

        {/* 履歴レビュー中(演奏を選択中)は録音ボタンを隠し、演奏モードへ戻すリードを表示 */}
        {selected ? (
          <div style={{ textAlign: "center", padding: "18px 16px", background: "linear-gradient(135deg,rgba(122,167,255,.10),rgba(232,178,60,.10))", border: "1px solid var(--line)", borderRadius: 14 }}>
            <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 700, color: "var(--text-ink)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Icon.png" alt="" aria-hidden width={20} height={20} style={{ borderRadius: 5 }} /> もう一度演奏してみよう！
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", marginBottom: 14 }}>この演奏をふまえて、もう一度チャレンジ</div>
            <button type="button" onClick={() => selectPerformanceById(null)} style={{ background: "var(--accent)", color: "var(--text-on-accent)", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: "var(--fs-subhead)", fontWeight: 700, cursor: "pointer" }}>演奏する</button>
          </div>
        ) : onboardingRecordStep ? (
          // オンボの録音ステップだけ、実録音せず「ふりかえり(見本)へ進むだけ」のボタンに差し替える。
          // 通常ユーザーの録音ボタン(下の Recorder)は元のまま。
          <div data-onboarding="scoreDetail.recordButton">
            <button
              type="button"
              onClick={() => handleTabChange("review")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 16px", background: "linear-gradient(100deg,#e5392b,#f0603a)", color: "var(--text-on-accent)", border: "none", borderRadius: 12, fontSize: "var(--fs-subhead)", fontWeight: 800, cursor: "pointer" }}
            >
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
              録音して採点
            </button>
          </div>
        ) : (
        <div data-onboarding="scoreDetail.recordButton">
          {/* 入口: 録音ボタン → 「全て録音 / 区間録音」の小メニュー (idle かつ 選択フロー外) */}
          {recordingState === "idle" && !rangeMode && (
            <div className={styles.recordEntry}>
              {recordMenuOpen && (
                <div className={styles.recordMenuBackdrop} onClick={() => setRecordMenuOpen(false)} />
              )}
              <button
                type="button"
                className={`${styles.recordEntryBtn} recBreathe`}
                onClick={() => setRecordMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={recordMenuOpen}
              >
                <span className={styles.recordEntryDot} />
                <span>録音して採点</span>
                <svg className={`${styles.recordEntryChev} ${recordMenuOpen ? styles.recordEntryChevOpen : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {recordMenuOpen && (
                <div className={styles.recordMenu} role="menu">
                  <button type="button" role="menuitem" className={styles.recordMenuItem} onClick={recordFull}>
                    <span className={`${styles.recordMenuIcon} ${styles.recordMenuIconAll}`} aria-hidden>●</span>
                    <span className={styles.recordMenuText}>
                      <span className={styles.recordMenuTitle}>通しで録音</span>
                      <span className={styles.recordMenuDesc}>はじめから終わりまで</span>
                    </span>
                  </button>
                  <button type="button" role="menuitem" className={styles.recordMenuItem} onClick={enterRangeFlow}>
                    <span className={`${styles.recordMenuIcon} ${styles.recordMenuIconRange}`} aria-hidden>⌒</span>
                    <span className={styles.recordMenuText}>
                      <span className={styles.recordMenuTitle}>区間を選ぶ</span>
                      <span className={styles.recordMenuDesc}>気になるところだけ練習する</span>
                    </span>
                  </button>
                  <button type="button" className={styles.recordMenuCancel} onClick={() => setRecordMenuOpen(false)}>キャンセル</button>
                </div>
              )}
            </div>
          )}

          {/* 区間録音フロー: 下部シート — 原本 s04 №03 写経 (⌒金タイトル ・ 区間録音=赤グラデ ・ 取消=mute ・ 小節/秒の脚注)。
              機能は維持: 難所プリセット ・ なぞり/タップ選択 ・ 基礎練のループ練習 */}
          {recordingState === "idle" && rangeMode && (
            <div className={styles.rangeSheet} role="dialog" aria-label="区間を選ぶ">
              <div className={styles.rangeSheetHead}>
                <span className={styles.rangeSheetTitle}><span className={styles.rangeSheetArc} aria-hidden>⌒</span>区間を選ぶ</span>
                {hardestRange && (
                  <button
                    type="button"
                    className={`${styles.rangePresetBtn} ${styles.rangePresetHard}`}
                    onClick={() => { if (isRangeLooping) stopPlayback(); awaitingEndTapRef.current = false; setRangeStart(hardestRange.from); setRangeEnd(hardestRange.to) }}
                    title="直近の採点で崩れた箇所"
                  >
                    難所
                  </button>
                )}
              </div>
              {rangeStart === null && (
                <p className={styles.rangeSheetHint}>はじめと おわりの音を タップしてね</p>
              )}
              {rangeStart !== null && rangeEnd === null && (
                <p className={styles.rangeSheetHint}>次に <b>終了</b> をタップ、または <b>なぞって</b>ください</p>
              )}
              {rangeStart !== null && rangeEnd !== null && (
                <p className={styles.rangeSheetHint}>両端の <b>◯</b> をドラッグで微調整できます</p>
              )}
              <div className={styles.rangeSheetActions}>
                {/* 曲は採点が目的なのでループ練習ボタンは出さない。基礎練は採点非対応のためループを残す */}
                {!isScoreMode && (!isRangeLooping ? (
                  <button type="button" className={styles.sheetLoopBtn} disabled={rangeStart === null || rangeEnd === null} onClick={startRangeLoop}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                    ループ練習
                  </button>
                ) : (
                  <button type="button" className={styles.sheetLoopStopBtn} onClick={stopPlayback}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
                    ループ停止
                  </button>
                ))}
                {isScoreMode && (
                  <button type="button" className={styles.sheetScoreBtn} disabled={recordingState !== "idle" || rangeStart === null || rangeEnd === null} onClick={recordSelectedRange}>
                    区間録音
                  </button>
                )}
                <button type="button" className={styles.sheetCancelBtn} onClick={exitRangeFlow}>取消</button>
              </div>
              {rangeSummary && <p className={styles.rangeSheetNote}>{rangeSummary}</p>}
            </div>
          )}

          <div className={styles.recorderHost}>
          <Recorder
            onRecordingComplete={handleRecordingComplete}
            previousBestScore={bestPitchScore}
            bpm={playbackTempo}
            onCountdownStart={() => setRecordingState("countdown")}
            // 2026-08-27: Recorder の状態をそのまま写す。
            // 従来は進む向き (countdown / recording / preview) しか受け取っておらず、
            // 「もう一度録音する」で idle に戻ったことが伝わらなかった。
            // recordingState が preview のまま固定され、これを条件にしている
            // 録音の入口・区間録音がすべて消えていた (ページを開き直すまで復帰しない)。
            onStatusChange={(s) => setRecordingState(s)}
            timeNumerator={analysis?.time_signature?.numerator ?? null}
            timeDenominator={analysis?.time_signature?.denominator ?? null}
            onGuideOffset={(sec) => { guideOffsetSecRef.current = sec }}
            onPrepare={prepareBand}
            onRecordingStart={() => { setRecordingState("recording"); startRecordingGuide() }}
            onRecordingBpmChange={handleRecordingBpmChange}
            onRecordingStop={() => { setRecordingState("preview"); stopRecordingGuide() }}
            uploadProgress={uploadProgress}
            resolvedResult={(() => {
              // 直近録音の採点完了をポーリング結果から後追いで渡す (待ちカード→結果へ昇格)
              const p = lastRecordedId ? performances.find((x) => x.id === lastRecordedId) : null
              if (!p || p.pitchAccuracy == null) return null
              return {
                pitchAccuracy: p.pitchAccuracy,
                timingAccuracy: p.timingAccuracy ?? null,
                overallScore: performanceScore(p),
                analysisSummary: p.analysisSummary as { primaryIssue?: string; primaryAdvice?: string } | undefined,
              }
            })()}
            onShowLoop={isScoreMode ? () => handleTabChange("review") : undefined}
            onIdleRecordClick={() => {
              // 録音CTA押下の瞬間に「この録音が区間録音か」を確定。
              // 区間ボタン経由なら pendingRangeRef がセット済 → 確定。通常録音なら null。
              const r = pendingRangeRef.current
              pendingRangeRef.current = null
              recordingRangeRef.current = r
              // パート: 区間と同じタイミングで確定 (区間が無ければパートも無し)
              recordingPartIdRef.current = r ? pendingPartIdRef.current : null
              pendingPartIdRef.current = null
              if (r && analysis) {
                const startSec = analysis.notes[r.from]?.start_time_sec ?? 0
                const endSec = analysis.notes[r.to]?.end_time_sec ?? startSec
                recGuideOffsetSecRef.current = startSec
                // 区間の実時間長 = 楽譜時間長 × (楽譜bpm / 録音bpm)。末尾に余韻+反応分のバッファ。
                const recBpm = recordingBpmRef.current || analysis.bpm
                const RANGE_TAIL_BUFFER_SEC = 2.0
                recGuideStopAtRealSecRef.current =
                  (endSec - startSec) * (analysis.bpm / recBpm) + RANGE_TAIL_BUFFER_SEC
              } else {
                recGuideOffsetSecRef.current = 0
                recGuideStopAtRealSecRef.current = Infinity
              }
            }}
          />
          </div>
        </div>
        )}
      </div>
      )}

      {/* ふりかえりタブ: 上達の推移 → ゴール/基礎練/学びポイント → (畳んだ)演奏履歴。曲・練習アイテム両対応。
          個別演奏の一覧は「すべての演奏を見る」で畳み、気になる人だけ展開する (2026-07-25 案1拡張)。 */}
      {activeTab === "review" && (
        <div data-section="review" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deleteHintBlock}
          {trajectoryBlock}
          {/* この曲の音程マップ (2026-08-11 Tetsuo確定): 上達のようすの下に曲全体の音の傾向 */}
          {/* モック MAP_CARD の写経: DSカード + lab + 注記11px + 指板 (パネル側で inset 化) */}
          {songHeatmap && Object.keys(songHeatmap.cells).length > 0 && (
            <SongMapCard kind={isScoreMode ? "score" : "practice"} targetId={isScoreMode ? score.id : practiceItemId!} initial={songHeatmap} />
          )}
          {isScoreMode && <ScoreLoopDetail scoreId={score.id} userId={userId} />}
        </div>
      )}

      {/* 練習後カルテタブ (2026-08-11 Tetsuo確定): カルテは曲にぶら下がる独立エンティティ。
          先生が書いたカルテの一覧を新しい順に表示 (演奏履歴とは別物) */}
      {activeTab === "karte" && (
        <div data-section="karte" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div data-onboarding="scoreDetail.teacherKarte">
            <section style={{ background: "linear-gradient(180deg,var(--card-a),var(--card-b))", border: "1px solid var(--line)", borderRadius: 20, padding: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", margin: "0 0 10px", color: "var(--text-sub)" }}>先生からの練習後カルテ</h3>
              <StudentKarteCards kartes={teacherKartes} />
            </section>
          </div>
        </div>
      )}

      {arcoResult && (
        <ArcoResultOverlay
          scoreId={score.id}
          userId={userId}
          perf={{ id: arcoResult.id, pitchAccuracy: arcoResult.pitchAccuracy ?? null, timingAccuracy: arcoResult.timingAccuracy ?? null }}
          onClose={() => { setArcoResult(null); if (isScoreMode) handleTabChange("review") }}
        />
      )}

      {/* 全画面の祝いカード(MilestoneCelebration)は削除 (2026-08-12 Tetsuo指示:
          共有ありカルテ導線なしのカードがアルコ結果の前に出る二段表示の正体。
          祝いの見せ場はアルコ結果カード(マスター達成〜！見出し)に集約) */}

      <OnboardingTrigger pageKey={practiceItemId ? "practiceItem" : "scoreDetail"} />
    </div>
  )
}

// ── この曲の音程マップ ・ 範囲切替つき (2026-08-22 Tetsuo指示) ──
// 回数で選ぶ (3回/5回/10回/全部) と 期間で選ぶ (1週間/1ヶ月) の2タブ。
// 初期値 = 直近10回 (サーバ初期描画と一致)。切替時は server action で再集計。
function SongMapCard({ kind, targetId, initial }: {
  kind: "score" | "practice"
  targetId: string
  initial: HeatmapData
}) {
  const [mode, setMode] = useState<"count" | "period">("count")
  const [count, setCount] = useState<number>(10)   // 0 = 全部
  const [days, setDays] = useState<number>(7)
  const [data, setData] = useState<HeatmapData>(initial)
  const [loading, startLoad] = useTransition()
  const cacheRef = useRef<Map<string, HeatmapData>>(new Map())

  const load = (m: "count" | "period", c: number, d: number) => {
    const key = m === "count" ? `c${c}` : `d${d}`
    const hit = cacheRef.current.get(key)
    if (hit) { setData(hit); return }
    startLoad(async () => {
      const r = await getSongHeatmapRange(kind, targetId, m === "count" ? { count: c || null } : { sinceDays: d || null })
      if (r) { cacheRef.current.set(key, r); setData(r) }
    })
  }

  const chip = (on: boolean): React.CSSProperties => ({
    flex: "none", fontSize: 10.5, fontWeight: 800, fontFamily: "inherit", letterSpacing: ".03em",
    borderRadius: 999, padding: "4px 11px", cursor: "pointer", whiteSpace: "nowrap",
    border: `1px solid ${on ? "rgba(232,178,60,.34)" : "transparent"}`,
    background: on ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.1)",
    color: on ? "var(--gold)" : "var(--text-sub)",
  })
  const modeTab = (on: boolean): React.CSSProperties => ({
    flex: 1, fontSize: 11, fontWeight: 800, fontFamily: "inherit", padding: "6px 0", cursor: "pointer",
    border: "none", borderRadius: 8,
    background: on ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
    color: on ? "var(--gold)" : "var(--text-sub)",
    boxShadow: on ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
  })

  return (
    <section style={{ background: "linear-gradient(180deg,var(--card-a),var(--card-b))", border: "1px solid var(--line)", borderRadius: 20, padding: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", margin: 0, color: "var(--text-sub)" }}>この曲の音程マップ</h3>
      <div style={{ fontSize: 11, color: "var(--text-sub)", margin: "4px 0 8px" }}>
        えらんだ範囲の演奏 {data.perfCount}回分から。色がついた音をタップすると くわしく見られるよ。
      </div>

      {/* 範囲の選び方: 回数 / 期間 */}
      <div style={{ display: "flex", gap: 4, background: "#0e1830", border: "1px solid rgba(150,175,225,.1)", borderRadius: 10, padding: 3, marginBottom: 7 }}>
        <button type="button" style={modeTab(mode === "count")} onClick={() => { setMode("count"); load("count", count, days) }}>回数で選ぶ</button>
        <button type="button" style={modeTab(mode === "period")} onClick={() => { setMode("period"); load("period", count, days) }}>期間で選ぶ</button>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: 9 }}>
        {mode === "count" ? (
          <>
            {[3, 5, 10].map((c) => (
              <button key={c} type="button" style={chip(count === c)} onClick={() => { setCount(c); load("count", c, days) }}>直近{c}回</button>
            ))}
            <button type="button" style={chip(count === 0)} onClick={() => { setCount(0); load("count", 0, days) }}>全部</button>
          </>
        ) : (
          <>
            <button type="button" style={chip(days === 7)} onClick={() => { setDays(7); load("period", count, 7) }}>直近1週間</button>
            <button type="button" style={chip(days === 30)} onClick={() => { setDays(30); load("period", count, 30) }}>直近1ヶ月</button>
            <button type="button" style={chip(days === 0)} onClick={() => { setDays(0); load("period", count, 0) }}>全期間</button>
          </>
        )}
      </div>

      <div style={{ opacity: loading ? 0.45 : 1, transition: "opacity .2s" }}>
        {Object.keys(data.cells).length > 0 ? (
          <FingerboardPanel cells={data.cells} details={data.details} />
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 12, padding: "14px 12px" }}>
            この範囲には判定できる演奏がまだないよ。範囲を広げてみてね。
          </div>
        )}
      </div>
    </section>
  )
}
